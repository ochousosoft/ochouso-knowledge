//structure to manage data responses
var DataModel = function (data) {
    this.result = {
        // data : [],
        total: 0,
    };
    if (data) {
        this.result.data = data;
        if (data[0]) {
            this.result.total = data[0]._nut_count;
        }
    }
    this.code = 200;
    this.msg = 'OK';
    this.trace = '';
}

module.exports = DataModel;
