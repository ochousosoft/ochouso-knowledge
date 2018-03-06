var model = {
	datasource : 'ochouso-ds',	//ref to datasource connection info (postgres datasource defined in /datasources/)
	pk : 'id', //primary key
	table : 'posts', //Associated model table
	auto : '',
	columns : {
		id: 'integer',
		title: 'string',
		content: 'string',
		post_type: 'string',
		creation_date: 'string',
		modification_date: 'string'
	},
	projections : {
	'default' : {
			find : ['id','title','content','post_type', 'creation_date', 'modification_date'],
			save : ['title','content','post_type', 'modification_date'],
			from : 'posts',
			countColumn:'id',
			//TODO accept join in model to avoid creating new views
			join : '',
		}
    }
};

module.exports = model;
