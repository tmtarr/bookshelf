-- create table
create table booklist(
	id varchar(5),
	userid varchar(20),
	isbn13 varchar(13),
	bookname varchar(200),
	author varchar(100),
	publisher varchar(100),
	category varchar(100),
	read_date varchar(10),
	note varchar(100),
	ins_date varchar(19),
	upd_date varchar(19),
	ebook_flg varchar(1),
	wish_flg varchar(1),
	place varchar(20),
	rate varchar(2)
);

-- primary key
alter table booklist add constraint pk_booklist primary key(id);
