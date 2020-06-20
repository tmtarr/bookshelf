-- create table
create table user_t(
	userid varchar(20),
	name varchar(20),
	password varchar(100),
	public_flg varchar(1),
	ins_date varchar(19),
	upd_date varchar(19)
);

-- primary key
alter table user_t add constraint pk_user primary key(userid);
