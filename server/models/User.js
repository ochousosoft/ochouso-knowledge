var model = {
	datasource : 'ochouso-ds',	//ref to datasource connection info (postgres datasource defined in /datasources/)
	pk : 'id', //primary key
	table : 'users', //Associated model table
	auto : '',
	columns : {
		id					: 'integer',
		username					: 'string',
		password					: 'string',
		name	: 'string',
		state 			: 'integer',
		creation_date: 'string',
		user_type: 'integer'
	},
	projections : {
	'default' : {
			find : ['id','username','password','name','state','roles', 'creation_date', 'user_type', 'municipality_id'],
			save : ['username','password','name','state','roles', 'user_type'],
			from : 'v_users',
			countColumn:'id',
			//TODO accept join in model to avoid creating new views
			join : '',
		},
		'login': {
            find: ['id','username','password','name','state','roles', 'user_type', 'municipality_id'],
            from: 'v_users',
            countColumn: 'id',
    },
	},
	user_column : 'username',
	password_column : 'password',
	salt_column: 'salt'
};

module.exports = model;
