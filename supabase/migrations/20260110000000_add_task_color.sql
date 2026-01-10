-- Add color column to tasks table
-- This allows each task to have a custom border color

ALTER TABLE public.tasks ADD COLUMN color TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.tasks.color IS 'Custom color for task card border (hex format, e.g., #FF5733)';

-- Optional: Add a check constraint to validate hex color format
ALTER TABLE public.tasks ADD CONSTRAINT check_color_format 
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- Index for filtering tasks by color (optional, useful for future features)
CREATE INDEX idx_tasks_color ON public.tasks(color) WHERE color IS NOT NULL;
