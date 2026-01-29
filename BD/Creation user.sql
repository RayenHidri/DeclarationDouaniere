Create Role admin_user With 
	LOGIN 
	PASSWORD 'admin_pass';

CREATE DATABASE SAE_db 
	WITH OWNER = admin_user
	ENCODING ='UTF8'
	LC_COLLATE = 'en_US.utf8'
	LC_CTYPE = 'en_US.utf8'
	TEMPLATE = template0;

--Donner tous les droits sur la base à l’utilisateur
GRANT ALL PRIVILEGES ON DATABASE sae_db TO admin_user;
		