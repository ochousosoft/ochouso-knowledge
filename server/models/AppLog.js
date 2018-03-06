var model = {
	datasource : 'ochouso-ds',	//ref to datasource connection info (postgres datasource defined in /datasources/)
	pk : 'id', //primary key
	table : 'app_log', //Associated model table
	auto : '',
	columns : {
		id					: 'integer',
		log_date				: 'string',
		message			: 'string',
		terminal_id			: 'inetger',
		device_id				: 'inetger'
	},
	projections : {
	'default' : {
			find : ['id','log_date','message', 'terminal_id', 'device_id'],
			save : ['log_date','message', 'terminal_id', 'device_id'],
			from : 'app_log',
			countColumn:'id',
			//TODO accept join in model to avoid creating new views
			join : '',
		}
    }
};

module.exports = model;
