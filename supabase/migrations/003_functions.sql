-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'standard')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get property with all related data
CREATE OR REPLACE FUNCTION get_property_details(property_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'title', p.title,
        'description', p.description,
        'price', p.price,
        'location', p.location,
        'type', p.type,
        'bedrooms', p.bedrooms,
        'bathrooms', p.bathrooms,
        'area', p.area,
        'is_featured', p.is_featured,
        'is_active', p.is_active,
        'cover_photo_index', p.cover_photo_index,
        'broker_phone', p.broker_phone,
        'broker_email', p.broker_email,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'images', COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', pi.id,
                    'image_url', pi.image_url,
                    'processed_url', pi.processed_url,
                    'alt_text', pi.alt_text,
                    'display_order', pi.display_order
                ) ORDER BY pi.display_order
            ) FROM property_images pi WHERE pi.property_id = p.id),
            '[]'::json
        ),
        'features', (
            SELECT json_build_object(
                'has_pool', pf.has_pool,
                'has_garden', pf.has_garden,
                'has_garage', pf.has_garage,
                'has_security_system', pf.has_security_system,
                'has_air_conditioning', pf.has_air_conditioning,
                'has_premium_appliances', pf.has_premium_appliances
            ) FROM property_features pf WHERE pf.property_id = p.id
        ),
        'owner', (
            SELECT json_build_object(
                'id', pr.id,
                'full_name', pr.full_name,
                'email', pr.email,
                'phone', pr.phone
            ) FROM profiles pr WHERE pr.id = p.user_id
        )
    ) INTO result
    FROM properties p
    WHERE p.id = property_uuid AND p.is_active = true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search properties
CREATE OR REPLACE FUNCTION search_properties(
    search_query TEXT DEFAULT '',
    property_type_filter property_type DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    min_bedrooms INTEGER DEFAULT NULL,
    max_bedrooms INTEGER DEFAULT NULL,
    min_bathrooms INTEGER DEFAULT NULL,
    max_bathrooms INTEGER DEFAULT NULL,
    min_area DECIMAL DEFAULT NULL,
    max_area DECIMAL DEFAULT NULL,
    location_filter TEXT DEFAULT '',
    featured_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    location TEXT,
    type property_type,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL,
    is_featured BOOLEAN,
    cover_photo_index INTEGER,
    broker_phone TEXT,
    broker_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    images JSON,
    features JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.location,
        p.type,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.is_featured,
        p.cover_photo_index,
        p.broker_phone,
        p.broker_email,
        p.created_at,
        p.updated_at,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'image_url', pi.image_url,
                    'processed_url', pi.processed_url,
                    'alt_text', pi.alt_text,
                    'display_order', pi.display_order
                ) ORDER BY pi.display_order
            ) FROM property_images pi WHERE pi.property_id = p.id),
            '[]'::json
        ) as images,
        (
            SELECT json_build_object(
                'has_pool', pf.has_pool,
                'has_garden', pf.has_garden,
                'has_garage', pf.has_garage,
                'has_security_system', pf.has_security_system,
                'has_air_conditioning', pf.has_air_conditioning,
                'has_premium_appliances', pf.has_premium_appliances
            ) FROM property_features pf WHERE pf.property_id = p.id
        ) as features
    FROM properties p
    WHERE p.is_active = true
        AND (search_query = '' OR (
            p.title ILIKE '%' || search_query || '%' OR
            p.description ILIKE '%' || search_query || '%' OR
            p.location ILIKE '%' || search_query || '%'
        ))
        AND (property_type_filter IS NULL OR p.type = property_type_filter)
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
        AND (max_bedrooms IS NULL OR p.bedrooms <= max_bedrooms)
        AND (min_bathrooms IS NULL OR p.bathrooms >= min_bathrooms)
        AND (max_bathrooms IS NULL OR p.bathrooms <= max_bathrooms)
        AND (min_area IS NULL OR p.area >= min_area)
        AND (max_area IS NULL OR p.area <= max_area)
        AND (location_filter = '' OR p.location ILIKE '%' || location_filter || '%')
        AND (NOT featured_only OR p.is_featured = true)
    ORDER BY 
        CASE WHEN featured_only THEN p.is_featured END DESC,
        p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment property views
CREATE OR REPLACE FUNCTION increment_property_views(
    property_uuid UUID,
    viewer_ip_address TEXT DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO property_views (property_id, viewer_ip, user_agent)
    VALUES (property_uuid, viewer_ip_address, user_agent_string);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property analytics
CREATE OR REPLACE FUNCTION get_property_analytics(property_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_views', COUNT(*),
        'views_today', COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE),
        'views_this_week', COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days'),
        'views_this_month', COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'),
        'unique_ips', COUNT(DISTINCT viewer_ip),
        'recent_views', (
            SELECT json_agg(
                json_build_object(
                    'viewed_at', viewed_at,
                    'viewer_ip', viewer_ip
                ) ORDER BY viewed_at DESC
            ) FROM (
                SELECT viewed_at, viewer_ip 
                FROM property_views 
                WHERE property_id = property_uuid 
                ORDER BY viewed_at DESC 
                LIMIT 10
            ) recent
        )
    ) INTO result
    FROM property_views
    WHERE property_id = property_uuid;
    
    RETURN COALESCE(result, '{"total_views": 0, "views_today": 0, "views_this_week": 0, "views_this_month": 0, "unique_ips": 0, "recent_views": []}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 