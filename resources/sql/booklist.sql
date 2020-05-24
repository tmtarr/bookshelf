-- ƒe[ƒuƒ‹ì¬
create table booklist(
	id varchar(5),
	bookname varchar(100),
	author varchar(100),
	category varchar(100),
	place varchar(20),
	note varchar(100),
	isbn13 varchar(13),
	ebook_flg varchar(1),
	wish_flg varchar(1)
);

-- primary key
alter table booklist add constraint pk_booklist primary key(id);
