-- Patch admin password and teacher account link
UPDATE public.app_users 
SET password_hash = 'pbkdf2:sha256:100000$18f7e82e4e1353475b5f1a9caf417e27$93363ce6a40e4c48b733d8244f197a9b2ab9368590454cddba96795214ab26d8', 
    plain_password = 'callmemrpenguin' 
WHERE LOWER(username) = 'admin';

UPDATE public.teachers_cm 
SET full_name = 'Thùy Trang' 
WHERE id = 2;
