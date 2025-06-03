-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON properties
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all properties
CREATE POLICY "Admins can manage all properties" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Property features policies
CREATE POLICY "Anyone can view property features" ON property_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_features.property_id 
            AND properties.is_active = true
        )
    );

CREATE POLICY "Property owners can manage features" ON property_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_features.property_id 
            AND properties.user_id = auth.uid()
        )
    );

-- Property images policies
CREATE POLICY "Anyone can view property images" ON property_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_images.property_id 
            AND properties.is_active = true
        )
    );

CREATE POLICY "Property owners can manage images" ON property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_images.property_id 
            AND properties.user_id = auth.uid()
        )
    );

-- Property views policies (for analytics)
CREATE POLICY "Anyone can insert property views" ON property_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Property owners can view their property analytics" ON property_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_views.property_id 
            AND properties.user_id = auth.uid()
        )
    );

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- Contact requests policies
CREATE POLICY "Anyone can create contact requests" ON contact_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Property owners can view contact requests for their properties" ON contact_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = contact_requests.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can update contact requests for their properties" ON contact_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = contact_requests.property_id 
            AND properties.user_id = auth.uid()
        )
    ); 