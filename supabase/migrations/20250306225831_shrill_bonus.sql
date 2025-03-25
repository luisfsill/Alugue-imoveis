/*
  # Add updated_at trigger function

  1. Changes
    - Add trigger function to automatically update updated_at column
    - Add trigger to properties table for automatic timestamp updates

  Note: Using DO blocks with proper syntax to check for existing objects
*/

-- Create function to update updated_at column if it doesn't exist
DO $$
DECLARE
  function_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) INTO function_exists;

  IF NOT function_exists THEN
    EXECUTE $func$
      CREATE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $trigger$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $trigger$ LANGUAGE plpgsql;
    $func$;
  END IF;
END
$$;

-- Create trigger on properties table if it doesn't exist
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_properties_updated_at'
  ) INTO trigger_exists;

  IF NOT trigger_exists THEN
    CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;