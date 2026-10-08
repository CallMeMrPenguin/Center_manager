-- Patch admin password and teacher account link
UPDATE public.app_users 
SET password_hash = 'pbkdf2:sha256:100000$4d8c101c92e4ac3b256c42a8af94829b$3dcf0c44740190c22f5e1880d8b9eb370d750fa9bc586d5f0ae95c241a1d2d7a', 
    plain_password = 'callmemrpenguin',
    updated_at = NOW()
WHERE LOWER(username) = 'admin';

UPDATE public.teachers_cm 
SET full_name = 'Thùy Trang' 
WHERE id = 2;
