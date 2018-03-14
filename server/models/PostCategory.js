var model = {
	datasource : 'ochouso-ds',	//ref to datasource connection info (postgres datasource defined in /datasources/)
	pk : 'id', //primary key
	table : 'posts_x_categories', //Associated model table
	auto : '',
	columns : {
		id: 'integer',
		category_id:'integer',
		post_id:'integer'
	},
	projections : {
	'default' : {
			find : ['id','category_id','post_id'],
			save : ['category_id','post_id'],
			from : 'posts_x_categories',
			countColumn:'id',
			//TODO accept join in model to avoid creating new views
			join : '',
		}
    }
};

module.exports = model;
