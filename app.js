"use strict"
// - - - BUDGET Controller

var BudgetController = (function() {

  var Expenses = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  }

  Expenses.prototype.calcPercentage = function(totalIncome) {

    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expenses.prototype.getPercentage = function() {
    return this.percentage;
  };

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  }

  var calculateTotal = function(type) {
    var sum = 0;
    //sum = data.allItems[type].reduce(((sum, currentItem) => sum + currentItem), 0); - хотел через reduce() но я нуб

    data.allItems[type].forEach((cur) => sum += cur.value);
    data.totals[type] = sum;
  }

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  }



  function addItem(type, des, val) {
    var newItem, Id;

    // Create new ID
    if (data.allItems[type].length > 0) {
      Id = data.allItems[type][data.allItems[type].length - 1].id + 1;
    } else {
      Id = 0;
    }


    // Create new item
    if (type === "exp") {
      newItem = new Expenses(Id, des, val);
    } else if (type === "inc") {
      newItem = new Income(Id, des, val);
    };
    // push it into our data structure
    data.allItems[type].push(newItem);

    //return the new element
    return newItem;
  };

  function deleteItem(type, id) {
    var ids, index;
    ids = data.allItems[type].map(function(current) {
      return current.id;
    });

    index = ids.indexOf(id)

    if (index !== -1) {
      data.allItems[type].splice(index, 1);
    };
  }

  function calculateBudget() {

    //calculate total income and total expenses
    calculateTotal('exp');
    calculateTotal('inc');

    //calculate the budget
    data.budget = data.totals.inc - data.totals.exp;

    // calculate the percentage
    if (data.totals.inc > 0) {
      data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
    } else {
      data.percentage = -1;
    }
  }


  function getBudget() {
    return {
      budget: data.budget,
      totalInc: data.totals.inc,
      totalExp: data.totals.exp,
      percentage: data.percentage
    }
  }

  function calculatePercentages() {
    data.allItems.exp.forEach((cur) => cur.calcPercentage(data.totals.inc));
  };

  function getPercentages() {
    var allPerc = data.allItems.exp.map((cur) => cur.getPercentage());
    return allPerc;
  }



  return {
    addItem: addItem,
    deleteItem: deleteItem,
    calculateBudget: calculateBudget,
    calculatePercentages: calculatePercentages,
    getPercentages: getPercentages,
    getBudget: getBudget,

    testing: function() {
      console.log(data);
    }
  }

})();


//  - - - UI Controller

var UIController = (function() {

  var DOMStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercentageLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  }

  var getInput = function() {

    return {
      type: document.querySelector(DOMStrings.inputType).value,
      description: document.querySelector(DOMStrings.inputDescription).value,
      value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
    }
  };

  var formatNumber = function(num, type) {
    var numSplit, int, dec, sign;
    /*
    + or - before the formatNumber
    2 decimals point
    coma sep. the thousands
    2310.4567 -> + 2,310.46  (example)
    */

    num = Math.abs(num);
    num = num.toFixed(2);
    numSplit = num.split('.');
    int = numSplit[0];

    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
    };

    dec = numSplit[1];

    return (type === 'exp' ? sign = '-' : '+') + ' ' + int + '.' + dec;

  };

  var addListItem = function(obj, type) {
    var html, newHtml, element;

    // Create HTML placeholder
    if (type === 'inc') {
      element = DOMStrings.incomeContainer;
      html = `<div class="item clearfix" id="inc-%id%">
      <div class="item__description">%description%</div>
      <div class="right clearfix"><div class="item__value">%value%</div>
      <div class="item__delete">
      <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
      </div></div></div>`;
    } else {
      element = DOMStrings.expensesContainer;
      html = `<div class="item clearfix" id="exp-%id%">
      <div class="item__description">%description%</div><div class="right clearfix">
      <div class="item__value">%value%</div>
      <div class="item__percentage">21%</div>
      <div class="item__delete">
      <button class="item__delete--btn">
      <i class="ion-ios-close-outline"></i></button>
      </div></div></div>`;
    }

    // Replace the placeholder with data
    newHtml = html.replace('%id%', obj.id);
    newHtml = newHtml.replace('%description%', obj.description);
    newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

    // Insert the HTML to the DOM
    document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
  };

  function deleteListItem(selectorID) {
    var el = document.getElementById(selectorID);
    el.parentNode.removeChild(el);
  };

  // function that clean the fields after adding them to the page
  var clearFields = function() {
    var fields, fieldsArray;

    fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);
    fieldsArray = Array.prototype.slice.call(fields);
    fieldsArray.forEach((el) => el.value = "");
    fieldsArray[0].focus();
  };

  function displayBudget(obj) {

    var type;
    obj.budget > 0 ? type = 'inc' : 'exp';

    document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
    document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
    document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
    if (obj.percentage > 0) {
      document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
    } else {
      document.querySelector(DOMStrings.percentageLabel).textContent = '---';
    }
  };

  var nodeListForEach = function(list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    };
  };

  function displayPercentages(percentages) {

    var fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel);


    nodeListForEach(fields, function(current, index) {

      if (percentages[index] > 0) {
        current.textContent = percentages[index] + '%';
      } else {
        current.textContent = '---';
      };
    });
  }

  function displayMonth() {
    var now, year, month, months;
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    now = new Date();
    month = now.getMonth();
    year = now.getFullYear();
    document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;

  }

  function changedType() {
    var fields = document.querySelectorAll(
      DOMStrings.inputType + ',' +
      DOMStrings.inputDescription + ',' +
      DOMStrings.inputValue);

    nodeListForEach(fields, (cur) => cur.classList.toggle('red-focus'));

    document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
  };




  return {
    getInput: getInput,
    addListItem: addListItem,
    deleteListItem: deleteListItem,
    clearFields: clearFields,
    displayBudget: displayBudget,
    displayPercentages: displayPercentages,
    displayMonth: displayMonth,
    changedType: changedType,
    DOMStrings: DOMStrings
  }

})();


// - - - Controller

var Controller = (function(Budgetctrl, UIctrl) {

  var updateBudget = function() {

    // 1. Calculate the budget
    Budgetctrl.calculateBudget();

    // 2. Return the budget
    var budget = Budgetctrl.getBudget();

    // 3. Display the Budget on the UI
    UIctrl.displayBudget(budget);
  };

  var updatePercentages = function() {

    // 1. Calculate the percentages
    Budgetctrl.calculatePercentages();
    // 2. Read pe-es from the budget Controller
    var percentages = Budgetctrl.getPercentages();
    // 3. Update the UI with new percentages
    UIctrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function() {
    var input, newItem;

    // 1. Get the field input data
    input = UIctrl.getInput();
    console.log(input);

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

      // 2. Add the item to the budget Controller
      newItem = Budgetctrl.addItem(input.type, input.description, input.value);

      // 3. Add the item to UI
      UIctrl.addListItem(newItem, input.type);

      // 3.1 Clear the fields
      UIctrl.clearFields();

      // 4. Calculate and update the budget
      updateBudget();

      // 5. Calculate and update percentages
      updatePercentages()
    }

  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID, type, id;
    itemID = event.target.parentNode.parentNode.parentNode.id;
    if (itemID) {
      splitID = itemID.split('-');
      type = splitID[0];
      id = parseInt(splitID[1]);

      // 1. delete the item from the data structure
      Budgetctrl.deleteItem(type, id);

      // 2. Delete the item from the UI
      UIctrl.deleteListItem(itemID);

      // 3. Update and show the new budget__title
      updateBudget();

      // 4. Calculate and update percentages
      updatePercentages()
    }
  };



  var setupEventListeners = function() {

    document.querySelector(UIctrl.DOMStrings.inputBtn).addEventListener("click", ctrlAddItem);
    document.addEventListener("keypress", function(event) {

      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(UIctrl.DOMStrings.container).addEventListener('click', ctrlDeleteItem);
    document.querySelector(UIctrl.DOMStrings.inputType).addEventListener('change', UIctrl.changedType);

  };

  return {
    init: function() {
      console.log("APP has started");
      UIctrl.displayMonth();
      UIctrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });
      setupEventListeners();
    }
  }

})(BudgetController, UIController);


// - - - the APP launch

Controller.init();
