var model = {
	datasource : 'ochouso-ds',	//ref to datasource connection info (postgres datasource defined in /datasources/)
	pk : 'id', //primary key
	table : 'categories', //Associated model table
	auto : '',
	columns : {
		id: 'integer',
		title: 'string',
		content: 'string',
		post_type: 'string',
		parent_category_id:'integer'
	},
	projections : {
	'default' : {
			find : ['id','code','description','parent_category_id'],
			save : ['code','description','parent_category_id'],
			from : 'categories',
			countColumn:'id',
			//TODO accept join in model to avoid creating new views
			join : '',
		}
    }
};

module.exports = model;
