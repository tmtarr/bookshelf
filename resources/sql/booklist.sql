-- ƒe[ƒuƒ‹ì¬
create table booklist(
	id varchar(5),
	bookname varchar(200),
	author varchar(100),
	category varchar(100),
	place varchar(20),
	note varchar(100),
	isbn13 varchar(13),
	ebook_flg varchar(1),
	wish_flg varchar(1),
	userid varchar(20),
	ins_date varchar(19),
	upd_date varchar(19),
	publisher varchar(100),
	read_date varchar(10)
);

-- primary key
alter table booklist add constraint pk_booklist primary key(id);
