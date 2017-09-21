angular.module('myApp', ['ngRoute','ngFileUpload'])
//routing config
.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl : 'templates/employee_list.html',
                controller : 'EmployeeListCtrl'
            })
            .when('/new_employee', {
                templateUrl :'templates/newEmployee.html',
                controller : 'NewEmployeeCtrl'
            })
            .when('/:id/reports', {
                templateUrl : 'templates/dirReports.html',
                controller : 'DirReportsCtrl'
            })
            .when('/:id', {
                templateUrl : 'templates/editEmployee.html',
                controller : 'EditEmployeeCtrl'
            })
            .otherwise({
                redirectTo :  '/'
            });
    }])
//employee data factory
.factory('employeeFactory', ['$http',function($http) {
    return {
        getEmployees : function() {
            return $http.get('/employees');
        },
        addEmployee : function(data) {
            return $http.post('/employees',data);
        },
        getDirectReports : function(id) {
            return $http.get('/employees/' + id + '/reports');
        },
        getOneEmployee : function(id) {
            return $http.get('/employees/' + id);
        },
        deleteEmployee : function(employee) {
            return $http.delete('/employees/' + employee._id, employee);
        },
        updateEmployee : function(employee) {
            return $http.put('/employees/' + employee._id, employee);
        }
    };
}])

    .controller('EditEmployeeCtrl', function($scope, $routeParams, Upload, $timeout, $location, employeeFactory) {
        employeeFactory.getOneEmployee($routeParams.id)
            .then(function(res) {
                $scope.employee = res.data;
            });
        employeeFactory.getEmployees()
            .then(function(res){
                $scope.employees = res.data;
            });
        $scope.updateEmployee = function() {
            employeeFactory.updateEmployee($scope.employee)
                .then(function(res) {
                    console.log("Updated"+ res);
                    $location.path("/");
                }, function(err) {
                    console.log(err);
                });
        };

        $scope.deleteProfile = function() {
            employeeFactory.deleteEmployee($scope.employee)
                .then(function(res) {
                    $location.path("/");
                    console.log(res);
                }, function (err) {
                    console.log(err);
                    $location.path("/");
                });

        };

        $scope.uploadFiles = function(file, errFiles) {
            $scope.f = file;
            $scope.errFile = errFiles && errFiles[0];
            if (file) {
                file.upload = Upload.upload({
                    url: '/upload',
                    method: 'POST',
                    data : {name: $scope.employee.name.replace(' ', '')},
                    file: file
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                }, function (response) {
                    if (response.status > 0) {
                        $scope.errorMsg = response.status + ': ' + response.data;
                        console.log($scope.errorMsg);
                    }
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                });
            }
        };
    })

//employee direct reports page
.controller('DirReportsCtrl', function($scope, $routeParams, employeeFactory) {
    $scope.employees = [];
    employeeFactory.getDirectReports($routeParams.id)
        .then(function(res) {
            $scope.employees = res.data;
            if ($scope.employees.length == 0)
                {$scope.message = "Oops, this employee doesn't have any direct reports!";}
        });
})

//new employee controller
    .controller('NewEmployeeCtrl', function($scope, $location, Upload, $timeout, employeeFactory) {
        employeeFactory.getEmployees()
            .then(function(res){
                $scope.employees = res.data;
            });
        $scope.addEmployee = function() {
            var employee = {
                name : $scope.fName + " " + $scope.lName,
                title : $scope.title,
                cellPhone : $scope.cellPhone,
                email : $scope.email
            };
            if($scope.manager && ($scope.manager != 'None')) employee.manager = $scope.manager;
            employeeFactory.addEmployee(employee)
                .then(function(res) {
                    $location.path("/");
                    console.log(res);
                }, function(err) {
                    $location.path("/");
                    console.log(err);
                });

        };
        $scope.uploadFiles = function(file, errFiles) {
            $scope.f = file;
            $scope.errFile = errFiles && errFiles[0];
            if (file) {
                file.upload = Upload.upload({
                    url: '/upload',
                    method: 'POST',
                    data : {name: $scope.fName + $scope.lName},
                    file: file
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                }, function (response) {
                    if (response.status > 0) {
                        $scope.errorMsg = response.status + ': ' + response.data;
                        console.log($scope.errorMsg);
                    }
                }, function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                });
            }
        };
    })
//employee list controller
.controller('EmployeeListCtrl', function($scope,$location,employeeFactory) {
    $scope.sort = function(keyname){
        $scope.sortKey = keyname;
        $scope.reverse = !$scope.reverse;
    }

    employeeFactory.getEmployees()
        .then(function(res) {
            $scope.employees = res.data;
        });

    $scope.viewDetail = function(employee) {
        $location.path("/" + employee._id);
    };
    //list sorting
    $scope.orderByMe = function(me) {
        $scope.myOrderBy = me;
    };

});
