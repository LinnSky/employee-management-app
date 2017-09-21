var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmployeeSchema = new Schema({
    name : String,
    title : String,
    cellPhone : String,
    email : String,
    manager : String
});

module.exports = mongoose.model('Employee', EmployeeSchema);
