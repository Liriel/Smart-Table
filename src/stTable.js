(function (ng, undefined) {
    'use strict';
    ng.module('smart-table')
        .controller('stTableController', ['$scope', '$parse', '$filter', '$attrs', function StTableController($scope, $parse, $filter, $attrs) {

            var propertyName = $attrs.stTable;
            var displayGetter = $parse(propertyName);
            var displaySetter = displayGetter.assign;
            var safeGetter;
            var orderBy = $filter('orderBy');
            var filter = $filter('filter');
            var safeCopy = copyRefs(displayGetter($scope));
            var tableState = {
                sort: {},
                search: {},
                pagination: {
                    start: 0
                }
            };
            var pipeAfterSafeCopy = true;
            var ctrl = this;

            function copyRefs(src) {
                return [].concat(src);
            }

            function updateSafeCopy() {
                safeCopy = copyRefs(safeGetter($scope));
                if (pipeAfterSafeCopy === true) {
                    ctrl.pipe();
                }
            }

            if ($attrs.stSafeSrc) {
                safeGetter = $parse($attrs.stSafeSrc);
                $scope.$watch(function () {
                    return safeGetter($scope).length
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        updateSafeCopy()
                    }
                });
                $scope.$watch(function () {
                    return safeGetter($scope);
                }, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        updateSafeCopy();
                    }
                });
            }

            /**
             * sort the rows
             * @param predicate function or string which will be used as predicate for the sorting
             * @param [optional] reverse if you want to reverse the order
             */
            this.sortBy = function sortBy(predicate, reverse) {
                tableState.sort.predicate = predicate;
                tableState.sort.reverse = reverse === true;
                tableState.pagination.start = 0;
                this.pipe();
                $scope.$broadcast('st:sort', {predicate: predicate});
            };

            /**
             * search matching rows
             * @param input the input string
             * @param predicate [optional] the property name against you want to check the match, otherwise it will search on all properties
             */
            this.search = function search(input, predicate) {
                var predicateObject = tableState.search.predicateObject || {};
                var prop = predicate ? predicate : '$';
                predicateObject[prop] = input;
                tableState.search.predicateObject = predicateObject;
                tableState.pagination.start = 0;
                this.pipe();
                $scope.$broadcast('st:search', {input: input, predicate: predicate});
            };

            /**
             * this will chain the operations of sorting and filtering based on the current table state (sort options, filtering, ect)
             */
            this.pipe = function pipe() {
                var filtered = tableState.search.predicateObject ? filter(safeCopy, tableState.search.predicateObject) : safeCopy;
                filtered = orderBy(filtered, tableState.sort.predicate, tableState.sort.reverse);
                if (tableState.pagination.number !== undefined) {
                    tableState.pagination.numberOfPages = filtered.length > 0 ? Math.ceil(filtered.length / tableState.pagination.number) : 1;
                    filtered = filtered.slice(tableState.pagination.start, tableState.pagination.start + tableState.pagination.number);
                }
                displaySetter($scope, filtered);
            };

            /**
             * select a dataRow (it will add the attribute isSelected to the row object)
             * @param row the row to select
             * @param mode "single" or "multiple"
             */
            this.select = function select(row, mode) {
                var rows = displayGetter($scope);
                var index = rows.indexOf(row);
                if (index !== -1) {
                    if (mode === 'single') {
                        ng.forEach(displayGetter($scope), function (value, key) {
                            value.isSelected = key === index ? !value.isSelected : false;
                        });
                    } else {
                        rows[index].isSelected = !rows[index].isSelected;
                    }
                }
            };

            /**
             * reset the sorting state
             */
            this.reset = function reset() {
                tableState.sort = {};
                tableState.pagination.start = 0;
                this.pipe();
                $scope.$broadcast('st:reset');
            };


            /**
             * take a slice of the current sorted/filtered collection (pagination)
             *
             * @param start index of the slice
             * @param number the number of item in the slice
             */
            this.slice = function splice(start, number) {
                tableState.pagination.start = start;
                tableState.pagination.number = number;
                this.pipe();
                $scope.$broadcast('st:splice', {start: start, number: number});
            };


            /**
             * return the current state of the table
             * @returns {{sort: {}, search: {}, pagination: {start: number}}}
             */
            this.tableState = function getTableState() {
                return tableState;
            };

            /**
             * Use a different filter function than the angular FilterFilter
             * @param filterName the name under which the custom filter is registered
             */
            this.setFilterFunction = function setFilterFunction(filterName) {
                filter = $filter(filterName);
            };

            /**
             *User a different function than the angular orderBy
             * @param sortFunctionName the name under which the custom order function is registered
             */
            this.setSortFunction = function setSortFunction(sortFunctionName) {
                orderBy = $filter(sortFunctionName);
            };

            /**
             * Usually when the safe copy is updated the pipe function is called.
             * Calling this method will prevent it, which is something required when using a custom pipe function
             */
            this.preventPipeOnWatch = function preventPipe() {
                pipeAfterSafeCopy = false;
            };
        }])
        .directive('stTable', ['$parse', function ($parse) {
            return {
                restrict: 'A',
                controller: 'stTableController',
                link: function (scope, element, attr, ctrl) {
                }
            };
        }]);
})(angular);