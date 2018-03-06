var model = {
	datasource : 'ochouso-ds',	//ref to datasource connection info (postgres datasource defined in /datasources/)
	pk : 'id', //primary key
	table : 'devices', //Associated model table
	auto : '',
	columns : {
		id: 'integer',
		cordova: 'string',
		platform: 'string',
		model: 'string',
		uuid:'string',
		version: 'string',
		manufacturer: 'string',
		serial: 'string',
		is_virtual: 'boolean',
		terminal_id: 'integer'
	},
	projections : {
	'default' : {
			find : ['id','cordova','platform','model','uuid','version','manufacturer','serial','is_virtual', 'terminal_id'],
			save : ['cordova','platform','model','uuid','version','manufacturer','serial','is_virtual', 'terminal_id'],
			from : 'devices',
			countColumn:'id',
			//TODO accept join in model to avoid creating new views
			join : '',
		}
    }
};

module.exports = model;
