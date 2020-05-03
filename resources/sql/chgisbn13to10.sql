create or replace function chgisbn13to10(isbn13 varchar) returns varchar AS $$
declare
	isbn10 varchar;
	isbn9  varchar;
	numcheck integer := 0;
	mod11  integer;
	checkdigit varchar;
begin
	-- 桁数チェック
	if char_length(isbn13) < 13 then
		return '';
	end if;

	-- チェックディジット計算
	isbn9 := substring(isbn13, 4, 9);
	numcheck := numcheck + to_number(substring(isbn9, 1, 1), '9') * 10;
	numcheck := numcheck + to_number(substring(isbn9, 2, 1), '9') * 9;
	numcheck := numcheck + to_number(substring(isbn9, 3, 1), '9') * 8;
	numcheck := numcheck + to_number(substring(isbn9, 4, 1), '9') * 7;
	numcheck := numcheck + to_number(substring(isbn9, 5, 1), '9') * 6;
	numcheck := numcheck + to_number(substring(isbn9, 6, 1), '9') * 5;
	numcheck := numcheck + to_number(substring(isbn9, 7, 1), '9') * 4;
	numcheck := numcheck + to_number(substring(isbn9, 8, 1), '9') * 3;
	numcheck := numcheck + to_number(substring(isbn9, 9, 1), '9') * 2;
	mod11 := 11 - (numcheck % 11);

	if mod11 = 11 then
		checkdigit := '0';
	elsif mod11 = 10 then
		checkdigit := 'X';
	else
		checkdigit := mod11;
	end if;

	return isbn9 || checkdigit;
end;
$$ language plpgsql;
