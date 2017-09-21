var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Employee= require('./../models/employee');
var async = require('async');

//get all employees
router.get('/', (req, res) => {
    //lean() returns a plain JavaScript object of doc. Mongoose skips the step of
    // creating the full model instance and we directly get a doc we can modify
    Employee.find({}).lean().exec(function(err,docs) {
       if(err || !docs) res.send(err);
       else {
           async.each(docs, function(doc, callback) {
               async.parallel([
                       //async task 1 : get manger object
                       function(cb) {
                           if(typeof doc.manager !== 'undefined') {
                               Employee.findById(doc.manager, function(err, managerDoc) {
                                   if (err)  return cb(err);
                                   doc.managerObj = managerDoc;
                                   cb();
                               });
                           }
                           else cb();
                       },
                       //async task 2 : get direct reports objects
                       function(cb) {
                               Employee.find({manager: doc._id}, function(err, dirReportDocs) {
                                   if(err)  return cb(err);
                                   doc.dirReports = dirReportDocs;
                                   cb();
                               });
                       }
                   ], function(err) {
                       //this is final callback for async parallel tasks
                        if(err) return callback(err);
                        callback();
                   }
               );
           }, function(err) {
               //this is final callback for async.each
               if(err) res.send(err);
               else res.json(docs);
           });
       }
    });
});

//create new employee
router.post('/', function(req, res) {
    var employee = new Employee(req.body);
    if(typeof req.body.manager === 'undefined') {
        employee.save(function(err) {
            if(err) res.send(err);
            else res.json({message: 'Employee successfully created!',employee: employee});
        });
    }else {
        console.log("Manger name:"+req.body.manager);
        //look up manager name in database
        Employee.findOne({name : req.body.manager}, function(err, doc) {
            if(err) res.send(err);
            else {
                if(doc) {
                    employee.manager = doc._id;
                    employee.save(function(err) {
                        if(err) res.send(err);
                        else res.json({message: 'Employee successfully created!',employee: employee});
                    });
                }else{
                    res.status(400).send("Failed to create user, invalid manager name");
                }

            }
        });
    }
});

//update employee
router.put('/:id', function(req, res) {
   Employee.findById(req.params.id, function(err, doc) {
       if(err) res.send(err);
       //only update user specified fields
       doc.name = req.body.name || doc.name;
       doc.title = req.body.title || doc.title;
       doc.cellPhone = req.body.cellPhone || doc.cellPhone;
       doc.email = req.body.email || doc.email;
       if(typeof req.body.manager !== 'undefined' ) {

           Employee.findOne({name: req.body.manager}, function(err, managerDoc) {
               if (err) res.send(err);
               else {
                   if (managerDoc) {
                       doc.manager = managerDoc._id;
                       doc.save(function(err) {
                           if (err) res.send(err);
                           else res.json({message: 'Employee successfully Updated!', doc: doc});
                       });
                   } else {
                       res.send("Failed to update user, invalid manager name");
                   }

               }
           });
       }
       else{
           doc.save(function(err) {
               if (err) res.send(err);
               else res.json({message: 'Employee successfully Updated!', doc: doc});
           });
       }
   });
});

//delete employee
router.delete('/:id', function(req, res) {
    Employee.remove({_id : req.params.id}, function(err) {
        if (err) res.send(err);
        else res.json({message:"Employee deleted!"});
    });
});

//get employee by id
router.get('/:id', function(req, res) {
    Employee.findById(req.params.id).lean().exec(function(err, doc) {
        console.log(doc);
        if(err || !doc) res.send(err || "Not found");
        else {
            async.parallel([
                    //async task 1 : get manger object
                    function(cb) {
                        if(typeof doc.manager !== 'undefined') {
                            Employee.findById(doc.manager, function(err, managerDoc) {
                                if (err)  return cb(err);
                                doc.managerObj = managerDoc;
                                cb();
                            });
                        }
                        else cb();
                    },
                    //async task 2 : get direct reports objects
                    function(cb) {
                        Employee.find({manager: doc._id}, function(err, dirReportDocs) {
                            if(err)  return cb(err);
                            doc.dirReports = dirReportDocs;
                            cb();
                        });
                    }
                ], function(err) {
                    //this is final callback for async parallel tasks
                    if(err) res.send(err);
                    else res.json(doc);
                }
            );
        }
    });
});

//get direct reports for specific employee
router.get('/:id/reports', function(req, res) {
    Employee.findById(req.params.id).lean().exec(function(err, idDoc) {
        if(err) res.send(err);
        else{
            Employee.find({manager: idDoc._id}).lean().exec(function(err, docs) {
                if(err || !docs) res.send(err);
                else {
                    async.each(docs, function(doc, callback) {
                        async.parallel([
                                //async task 1 : get manger object
                                function(cb) {
                                    if(typeof doc.manager !== 'undefined') {
                                        Employee.findById(doc.manager, function(err, managerDoc) {
                                            if (err)  return cb(err);
                                            doc.managerObj = managerDoc;
                                            cb();
                                        });
                                    }
                                    else cb();
                                },
                                //async task 2 : get direct reports objects
                                function(cb) {
                                    Employee.find({manager: doc._id}, function(err, dirReportDocs) {
                                        if(err)  return cb(err);
                                        doc.dirReports = dirReportDocs;
                                        cb();
                                    });
                                }
                            ], function(err) {
                                //this is final callback for async parallel tasks
                                if(err) return callback(err);
                                callback();
                            }
                        );
                    }, function(err) {
                        //this is final callback for async.each
                        if(err) res.send(err);
                        else res.json(docs);
                    });
                }
            });
        }
    });
});

module.exports = router;
