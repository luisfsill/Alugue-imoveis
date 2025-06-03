-- Fix admin permissions for property_features table
-- Add policy to allow admins to manage all property features

CREATE POLICY "Admins can manage all property features" ON property_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add policy to allow admins to manage all property images
CREATE POLICY "Admins can manage all property images" ON property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ); 