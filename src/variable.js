/*global define*/
define(["qlik", "./util", "./properties", "./vendors/moment.min"], function (qlik, util, prop, moment) {
    'use strict';

    prop.initialProperties.dateFormat = 'YYYY-MM-DD';
    qlik.currApp(this).variable.getContent('DateFormat', function(response) {
       prop.initialProperties.dateFormat = response.qContent.qString;
    });

    function calcPercent(el) {
        return (el.value - el.min) * 100 / (el.max - el.min);
    }

    function getClass(style, type, selected) {
        switch (style) {
            case "material":
            case "bootstrap":
                if (selected) {
                    return "selected";
                }
                break;
            default:
                switch (type) {
                    case 'button':
                        return selected ? 'qui-button-selected lui-button lui-button--success' : 'qui-button lui-button';
                    case 'select':
                        return 'qui-select lui-select';
                    case 'input':
                        return 'qui-input lui-input';
                }
        }
    }

    function getWidth(layout) {
        if (layout.render === "l") {
            return "98%";
        }
        if (layout.width === "custom") {
            return layout.customwidth;
        }
        if (layout.width === "fill") {
            if (layout.render !== "b") {
                return "100%";
            }
            return "calc( " + 100 / layout.alternatives.length + "% - 3px)";
        }
    }

    function getFormattedDate(val, fromFormat, toFormat) {
      return moment(val, fromFormat).format(toFormat);
      // moment(val, fromFormat).format(toFormat);
    }
    
    function changeVariableValue(currApp, varName, value) {
        // Qlik buggy code workaround:
        if(currApp.model && currApp.model.getVariableByName)
            currApp.model.getVariableByName(varName).then(function (variable) {
                variable.setStringValue(value);
            });
        else
            currApp.variable.setContent(varName, value);
    }

    function getVariableName(layout) {
        return layout.variableName_ || layout.variableName;
    }

    util.addStyleSheet("extensions/variable/variable.css");
    return {
        initialProperties: prop.initialProperties,
        definition: prop.definition,
        paint: function ($element, layout) {
            var wrapper = util.createElement('div', layout.style || 'qlik'),
                width = getWidth(layout),
                ext = this;
            if (layout.render === 'b') {
                layout.alternatives.forEach(function (alt) {
                    var btn = util.createElement('button', getClass(layout.style, 'button',
                        alt.value === layout.variableValue), alt.label);
                    btn.onclick = function () {
                        //qlik.currApp(ext).variable.setContent(layout.variableName, alt.value);
                        changeVariableValue(qlik.currApp(ext), getVariableName(layout), this.value);
                    };
                    btn.style.width = width;
                    wrapper.appendChild(btn);
                });
            } else if (layout.render === 's') {
                var sel = util.createElement('select', getClass(layout.style, 'select'));
                sel.style.width = width;
                layout.alternatives.forEach(function (alt) {
                    var opt = util.createElement('option', undefined, alt.label);
                    opt.value = alt.value;
                    opt.selected = alt.value === layout.variableValue;
                    sel.appendChild(opt);
                });
                sel.onchange = function () {
                    //qlik.currApp(ext).variable.setContent(layout.variableName, this.value);
                    changeVariableValue(qlik.currApp(ext), getVariableName(layout), this.value);
                };
                wrapper.appendChild(sel);
            } else if (layout.render === 'l') {
                var range = util.createElement('input');
                range.style.width = width;
                range.type = 'range';
                range.min = layout.min || 0;
                range.max = layout.max || 100;
                range.step = layout.step || 1;
                range.value = layout.variableValue;
                //range.style.width = '98%';
                range.onchange = function () {
                    if (this.label) {
                        this.label.style.left = calcPercent(this) + "%";
                        this.label.textContent = this.value;
                    } else {
                        this.title = this.value;
                    }
                    //qlik.currApp(ext).variable.setContent(layout.variableName, this.value);
                    changeVariableValue(qlik.currApp(ext), getVariableName(layout), this.value);
                };
                range.oninput = function () {
                    if (this.label) {
                        this.label.style.left = calcPercent(this) + "%";
                        this.label.textContent = this.value;
                    } else {
                        this.title = this.value;
                    }
                };
                wrapper.appendChild(range);
                if (layout.rangelabel) {
                    var labelwrap = util.createElement('div', 'labelwrap');
                    range.label = util.createElement('div', 'rangelabel', layout.variableValue);
                    range.label.style.left = calcPercent(range) + "%";
                    labelwrap.appendChild(range.label);
                    wrapper.appendChild(labelwrap);
                } else {
                    range.title = layout.variableValue;
                }
            } else if(layout.render === 'd') {
                var inputDate = util.createElement('input', getClass(layout.style, 'input'));
                inputDate.style.width = width;
                //inputDate.type = 'date';
				inputDate.setAttribute('type', 'date');
				//inputDate.required =  'required';
				inputDate.setAttribute('required', 'required');
                inputDate.value = getFormattedDate(layout.variableValue, layout.dateFormat, "YYYY-MM-DD").toString(); // 'yyyy-MM-dd', see  [RFC 3339]
                if(layout.minDate)
                  inputDate.min = getFormattedDate(layout.minDate, layout.dateFormat, "YYYY-MM-DD").toString();

                if(layout.maxDate)
                  inputDate.max = getFormattedDate(layout.maxDate, layout.dateFormat, "YYYY-MM-DD").toString();

                inputDate.onchange = function () {
                    var formattedVal = moment(this.value).format(layout.dateFormat).toString();
                    //qlik.currApp(ext).variable.setContent(layout.variableName, formattedVal);
                    changeVariableValue(qlik.currApp(ext), getVariableName(layout), formattedVal);
                };

                wrapper.appendChild(inputDate);
            } else {
                var fld = util.createElement('input', getClass(layout.style, 'input'));
                fld.style.width = width;
                fld.type = 'text';
                fld.value = layout.variableValue;
                fld.onchange = function () {
                    // Qlik buggy code workaround:
                    // qlik.currApp(ext).variable.setContent(layout.variableName, this.value);
                    changeVariableValue(qlik.currApp(ext), getVariableName(layout), this.value);
                };
                wrapper.appendChild(fld);
            }
            util.setChild($element[0], wrapper);
        }
    };

});
