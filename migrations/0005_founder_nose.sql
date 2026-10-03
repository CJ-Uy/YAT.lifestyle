-- The founder's seeded likes, run through inferNose (lib/element/nose.ts), give nose-2 / Open nose.
UPDATE element_profiles
SET nose_type = 'nose-2', nose_name = '{"en":"Open nose","zh-Hant":"樂於嘗試型","zh-Hans":"乐于尝试型"}'
WHERE id = 'founder-profile';
