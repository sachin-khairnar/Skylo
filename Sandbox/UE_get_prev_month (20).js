/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: User Event Script
 * Script Name: 
 * File Name: 
 * Created On: 31st Jan, 2023 
 * Created By: Nikita Mugalkhod (Yantra Inc)
 *********************************************************** */
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/format', 'N/runtime','N/error'],
	function (record, serverWidget, search, format, runtime, error) {

		function beforeLoad(context) {

			try {

				var s_type = context.type;
				log.debug('beforeLoad', 's_type ==' + s_type)

				if (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.PRINT) {

					var newRecord = context.newRecord;
					var form = context.form;

					var rec_id = newRecord.id;
					log.debug('Record ID', rec_id);

					var rec_type = newRecord.type;
					log.debug('Record Type', rec_type);
					if (rec_type == 'invoice') {

						var current = new Date();
						var getMonth = current.setMonth(current.getMonth() - 1);
						var previousMonth = current.toLocaleString('en-GB', {
							month: 'long'
						});

						//log.debug('PrevMonth',previousMonth); // "September" 

						var postingPeriod = newRecord.getText('postingperiod');
						//log.debug('postingPeriod',postingPeriod);
						log.debug("postingPeriod string",postingPeriod);
						
						var postingMonth = postingPeriod.substring(0,3);
						log.debug("postingMonth",postingMonth);
						
						var thisYear = postingPeriod.substring(4,8);
						log.debug("thisYear",thisYear);
						
						var dueDate = newRecord.getText("duedate");
						log.debug("dueDate",dueDate);
						
						dueDate= dueDate.split('/');
						log.debug("dueDate",dueDate[1]);
						
						var tranDate = newRecord.getText("trandate");
						log.debug("tranDate",tranDate);
						
						tranDate= tranDate.split('/');
						log.debug("tranDate",tranDate[1]);
						
						var tranDateStr = postingMonth+' '+tranDate[1]+' '+thisYear;
						log.debug("tranDateStr",tranDateStr);

						/* var thisYear = current.getYear();
						log.debug("thisYear",thisYear); */
						
						var dueDateStr = postingMonth+' '+dueDate[1]+' '+thisYear;
						log.debug("dueDateStr",dueDateStr);

						var monthStr = previousMonth.toString();

						var monthString = previousMonth.toString();
						monthStr = monthStr.split(' ');
						//log.debug(monthStr[0]);
						var newMonth = monthStr[0];
						//log.debug(newMonth);

						var year = monthString.split(',');
						var newYear = year[1];
						newYear = newYear.substring(0, 5);
						//log.debug(newYear);

						var splittedMonth = newMonth.substring(0, 3);
						//log.debug("splittedMonth",splittedMonth); 

						var fullStr = splittedMonth.concat(newYear);
						//log.debug('full string',fullStr);


						form.addField({
							"id": "custpage_prevmonth",
							"label": "Prev Month",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_prevmonth",
							value: fullStr
						});
						
						form.addField({
							"id": "custpage_trandate",
							"label": "Tran Date",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_trandate",
							value: tranDateStr
						});
						
						form.addField({
							"id": "custpage_duedate",
							"label": "Due Date",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_duedate",
							value: dueDateStr
						});



						/*************** get the units,slab field values from customer record for access, usage items respectively.*********/

						var customerID = newRecord.getValue('entity');
						log.debug("customerID", customerID);

						var custRec = record.load({
							type: record.Type.CUSTOMER,
							id: customerID,
							isDynamic: true
						});

						var billAdd = custRec.getValue('defaultaddress');
						log.debug(billAdd);

						form.addField({
							"id": "custpage_address",
							"label": "Address",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_address",
							value: billAdd
						});


						//get the access item data
						var access_arr = [];
						var customrecord_skylo_access_feeSearchObj = search.create({
							type: "customrecord_skylo_access_fee",
							filters: [
								["custrecord_skylo_linking_customer_record", "anyof", customerID],
								"AND",
								["isinactive", "is", "F"]
							],
							columns: [
								search.createColumn({
									name: "scriptid",
									sort: search.Sort.ASC,
									label: "Script ID"
								}),
								search.createColumn({
									name: "custrecord_skylo_access_fee_slab",
									label: "Access Fee Slab"
								}),
								search.createColumn({
									name: "custrecord_skylo_access_fee_field",
									label: "Access Charges (Per Slab)"
								}),
								search.createColumn({
									name: "custrecord_skylo_pooled_data_credit",
									label: "Pooled Data Credit"
								}),
								search.createColumn({
									name: "custrecord_skylo_unit_of_measure",
									label: "Units"
								}),
								search.createColumn({
									name: "custrecord_skylo_linking_customer_record",
									label: "Linking To Customer Record"
								})
							]
						});
						var searchResultCount = customrecord_skylo_access_feeSearchObj.runPaged().count;
						log.debug("customrecord_skylo_access_feeSearchObj result count", searchResultCount);
						customrecord_skylo_access_feeSearchObj.run().each(function (result) {
							// .run().each has a limit of 4,000 results

							var access_fee_slab = result.getValue('custrecord_skylo_access_fee_slab');
							log.debug("access_fee_slab", access_fee_slab);
							var access_pooled_data = result.getValue('custrecord_skylo_pooled_data_credit');
							log.debug("access_pooled_data", access_pooled_data);
							var access_unit = result.getText('custrecord_skylo_unit_of_measure');
							log.debug("access_unit", access_unit);
							var rec = {
								"access_fee_slab": access_fee_slab,
								"access_pooled_data": access_pooled_data,
								"access_unit": access_unit
							};
							access_arr.push(rec);
							return true;
						});

						var access_data = access_arr;
						log.debug("access_data", access_data);
						var accessFeeSlab = access_data[0].access_fee_slab;
						var accessPooledData = access_data[0].access_pooled_data;
						var accessUnit = access_data[0].access_unit;


						//get the usage data
						var usage_arr = [];
						var customrecord_skylo_usage_recordSearchObj = search.create({
							type: "customrecord_skylo_usage_record",
							filters: [
								["custrecord_skylo_usage_linking", "anyof", customerID],
								"AND",
								["isinactive", "is", "F"]
							],
							columns: [
								search.createColumn({
									name: "scriptid",
									sort: search.Sort.ASC,
									label: "Script ID"
								}),
								search.createColumn({
									name: "custrecord_skylo_item_record",
									label: "Item"
								}),
								search.createColumn({
									name: "custrecord_skylo_usage_charge_tier",
									label: "Usage Charge Tier"
								}),
								search.createColumn({
									name: "custrecord_skylo_interval",
									label: "Usage Charge Slab"
								}),
								search.createColumn({
									name: "custrecord_skylo_from_mb",
									label: "From"
								}),
								search.createColumn({
									name: "custrecord_skylo_to_mb",
									label: "To"
								}),
								search.createColumn({
									name: "custrecord_skylo_units_usage_record",
									label: "Units"
								}),
								search.createColumn({
									name: "custrecord_skylo_price",
									label: "Price"
								}),
								search.createColumn({
									name: "custrecord_usage_qty",
									label: "Quantity"
								})
							]
						});
						var searchResultCount = customrecord_skylo_usage_recordSearchObj.runPaged().count;
						log.debug("customrecord_skylo_usage_recordSearchObj result count", searchResultCount);
						customrecord_skylo_usage_recordSearchObj.run().each(function (result) {
							// .run().each has a limit of 4,000 results
							var usageslab = result.getValue('custrecord_skylo_interval');
							log.debug("usageslab", usageslab);
							var usage_units = result.getText('custrecord_skylo_units_usage_record');
							log.debug("usage_units", usage_units);
							/* var access_unit = result.getText('custrecord_skylo_unit_of_measure');
   log.debug("access_unit",access_unit);  */
							var usage_qty = result.getValue('custrecord_usage_qty');
							log.debug("usage_qty", usage_qty);
							var rec = {
								"usageslab": usageslab,
								"usage_units": usage_units,
								"usage_qty": usage_qty
							};
							usage_arr.push(rec);
							return true;
						});
						var usage_data = usage_arr;
						log.debug("usage_data", usage_data);
						var usageSlabArr = [];
						var usageUnitsArr = [];
						var usageCombinedArr = [];
						var usageQtyArr = [];
						for (var i = 0; i < usage_data.length; i++) {

							var usageSlab = usage_data[i].usageslab;
							log.debug("usageSlab", usageSlab);
							usageSlabArr.push(usageSlab);
							log.debug(usageSlabArr);
							var usageUnit = usage_data[i].usage_units;
							log.debug("usageUnit", usageUnit);
							usageUnitsArr.push(usageUnit);
							log.debug(usageUnitsArr);
							var combinedSlabUnit = usageSlab + usageUnit;
							log.debug("combinedSlabUnit", combinedSlabUnit);
							usageCombinedArr.push(combinedSlabUnit);
							log.debug(usageCombinedArr);
							var usageQty = usage_data[i].usage_qty;
							log.debug("usageQty", usageQty);
							usageQtyArr.push(usageQty);
							log.debug(usageQtyArr);

						}

						var usageQtyArrLen = usageQtyArr.length;
						log.debug("length", usageQtyArrLen);
						var count = 1;
						var usageQuantity = 0;
						for (var j = 0; j < usageQtyArr.length; j++) {
							log.debug(usageQuantity);
							usageQuantity = parseInt(usageQuantity) + parseInt(usageQtyArr[j]);
							log.debug("Total Qty", usageQuantity);
							count++;
						}
						//usageQuantity = Math.trunc(usageQuantity);
						log.debug("Total qty outside", usageQuantity);
						
						/* form.addField({
							"id": "custpage_totalqty",
							"label": "Total Qty",
							"type": "textarea"
						}); *//* .updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						}); */
						
						log.debug('after..');
						/*newRecord.setValue({
							fieldId: 'custbody_total_quantity',
							value: usageQuantity,
							//ignoreFieldChange: true
						});
						*/
						
						//var usageQty = newRecord.getValue('custbody_total_quantity');
						//log.debug("usageQty",usageQty);



						/* var usageUnit = '';
		for(var us=0;us<usageCombinedArr.length;us++)
		{
			var usage_combined = usageCombinedArr[us];
			log.debug('us combined',usage_combined);
			usageUnit += usage_combined + ',';
		}
		
		if (usageUnit) 
		{
             usageUnit = usageUnit.slice(0, -1);
        }
		
		  */



						form.addField({
							"id": "custpage_accessfeeslab",
							"label": "Prev Month",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_accessfeeslab",
							value: accessFeeSlab
						});

						form.addField({
							"id": "custpage_pooled_data",
							"label": "Prev Month",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_pooled_data",
							value: accessPooledData
						});
						
						context.newRecord.setValue({
						fieldId: 'custbody_pooled_data',
						value: accessPooledData,
						ignoreFieldChange: true
						});
						
						var getPooledData = newRecord.getValue("custbody_pooled_data");
						log.debug("pooled data",getPooledData);

						form.addField({
							"id": "custpage_access_unit",
							"label": "Prev Month",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_access_unit",
							value: accessUnit
						});

						form.addField({
							"id": "custpage_usageslab",
							"label": "Prev Month",
							"type": "textarea"
						}).updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});
						newRecord.setValue({
							fieldId: "custpage_usageslab",
							value: usageUnit
						});


						/* form.addField({ "id":"custpage_usage_combined_data", "label": "Usage Data", "type": "textarea" }).updateDisplayType({
                                displayType : serverWidget.FieldDisplayType.HIDDEN
                            });
		newRecord.setValue({fieldId: "custpage_usage_combined_data",value:usageCombinedArr});  */
		
		
		/*var id = record.submitFields({
 type: record.Type.INVOICE,
 id: rec_id,
 values: {
 custbody_total_quantity: usageQuantity
 },
 options: {
 enableSourcing: false,
 ignoreMandatoryFields : true
 }
});

log.debug("id",id);
*/





					}
				}
			} catch (ex) {
				log.debug('Error', ex);
			}

		}

		function afterSubmit(context) {
			try
			{
			var newRecord = context.newRecord;
			var form = context.form;

			var rec_id = newRecord.id;
			log.debug('Record ID', rec_id);

			var rec_type = newRecord.type;
			log.debug('Record Type', rec_type);
			//get the usage data

			var customerID = newRecord.getValue('entity');
			log.debug("customerID", customerID);

			var custRec = record.load({
				type: record.Type.CUSTOMER,
				id: customerID,
				isDynamic: true
			});
			
			var access_arr = [];
						var customrecord_skylo_access_feeSearchObj = search.create({
							type: "customrecord_skylo_access_fee",
							filters: [
								["custrecord_skylo_linking_customer_record", "anyof", customerID],
								"AND",
								["isinactive", "is", "F"]
							],
							columns: [
								search.createColumn({
									name: "custrecord_skylo_pooled_data_credit",
									label: "Pooled Data Credit"
								})
							]
						});
						var searchResultCount = customrecord_skylo_access_feeSearchObj.runPaged().count;
						log.debug("customrecord_skylo_access_feeSearchObj result count", searchResultCount);
						customrecord_skylo_access_feeSearchObj.run().each(function (result) {
							// .run().each has a limit of 4,000 results

							var access_pooled_data = result.getValue('custrecord_skylo_pooled_data_credit');
							log.debug("access_pooled_data", access_pooled_data);
							var rec = {
								"access_pooled_data": access_pooled_data,
							};
							access_arr.push(rec);
							return true;
						});

						var access_data = access_arr;
						log.debug("access_data", access_data);
						var accessPooledData = access_data[0].access_pooled_data;
						
						
						//newRecord.setValue("custbody_pooled_data",accessPooledData);
						//log.debug("value set..");
						
						var getPooledData = newRecord.getValue("custbody_pooled_data");
						log.debug("getPooledData",getPooledData);
						

			var usage_arr = [];
			var customrecord_skylo_usage_recordSearchObj = search.create({
				type: "customrecord_skylo_usage_record",
				filters: [
					["custrecord_skylo_usage_linking", "anyof", customerID],
					"AND",
					["isinactive", "is", "F"]
				],
				columns: [
					search.createColumn({
						name: "scriptid",
						sort: search.Sort.ASC,
						label: "Script ID"
					}),
					search.createColumn({
						name: "custrecord_skylo_item_record",
						label: "Item"
					}),
					search.createColumn({
						name: "custrecord_skylo_usage_charge_tier",
						label: "Usage Charge Tier"
					}),
					search.createColumn({
						name: "custrecord_skylo_interval",
						label: "Usage Charge Slab"
					}),
					search.createColumn({
						name: "custrecord_skylo_from_mb",
						label: "From"
					}),
					search.createColumn({
						name: "custrecord_skylo_to_mb",
						label: "To"
					}),
					search.createColumn({
						name: "custrecord_skylo_units_usage_record",
						label: "Units"
					}),
					search.createColumn({
						name: "custrecord_skylo_price",
						label: "Price"
					}),
					search.createColumn({
						name: "custrecord_usage_qty",
						label: "Quantity"
					})
				]
			});
			var searchResultCount = customrecord_skylo_usage_recordSearchObj.runPaged().count;
			log.debug("customrecord_skylo_usage_recordSearchObj result count", searchResultCount);
			customrecord_skylo_usage_recordSearchObj.run().each(function (result) {
				// .run().each has a limit of 4,000 results
				var usageslab = result.getValue('custrecord_skylo_interval');
				log.debug("usageslab", usageslab);
				var usage_units = result.getText('custrecord_skylo_units_usage_record');
				log.debug("usage_units", usage_units);
				var usage_qty = result.getValue('custrecord_usage_qty');
				log.debug("usage_qty", usage_qty);
				var rec = {
					"usageslab": usageslab,
					"usage_units": usage_units,
					"usage_qty": usage_qty
				};
				usage_arr.push(rec);
				return true;
			});
			var usage_data = usage_arr;
			log.debug("usage_data", usage_data);
			var usageSlabArr = [];
			var usageUnitsArr = [];
			var usageCombinedArr = [];
			var usageQtyArr = [];
			for (var i = 0; i < usage_data.length; i++) {

				var usageSlab = usage_data[i].usageslab;
				log.debug("usageSlab", usageSlab);
				usageSlabArr.push(usageSlab);
				log.debug(usageSlabArr);
				var usageUnit = usage_data[i].usage_units;
				log.debug("usageUnit", usageUnit);
				usageUnitsArr.push(usageUnit);
				log.debug(usageUnitsArr);
				var usageQty = usage_data[i].usage_qty;
				log.debug("usageQty", usageQty);
				usageQtyArr.push(usageQty);
				log.debug(usageQtyArr);
				var combinedSlabUnit = usageSlab + usageUnit;
				log.debug("combinedSlabUnit", combinedSlabUnit);
				usageCombinedArr.push(combinedSlabUnit);
				log.debug(usageCombinedArr);

			}
			var count = 1;
			var usage_slab = 0;
			for(var i=0;i< usageSlabArr.length;i++)
			{
				log.debug(usage_slab);
				usage_slab = parseInt(usage_slab) + parseInt(usageSlabArr[i]);
				log.debug("Slab", usage_slab);
				count++;
			}
			var count = 1;
			var usageQuantity = 0;
			for (var j = 0; j < usageQtyArr.length; j++) {
				log.debug(usageQuantity);
				usageQuantity = parseInt(usageQuantity) + parseInt(usageQtyArr[j]);
				log.debug("Total Qty", usageQuantity);
				count++;
			}
			log.debug("Total qty outside as", usageQuantity);



			var usageUnit = '';
			for (var us = 0; us < usageCombinedArr.length; us++) {
				var usage_combined = usageCombinedArr[us];
				log.debug('us combined', usage_combined);
				usageUnit += usage_combined + ',';
			}

			if (usageUnit) {
				usageUnit = usageUnit.slice(0, -1);
			}
			var usageAmount = newRecord.getValue({
				fieldId: 'custbody_usage_amount'
			});
			log.debug("Amount", usageAmount);
			var usageAmtStr = usageAmount.toString();
			log.debug("usageAmtStr", usageAmtStr);
			/* var strLen = usageAmtStr.length;
			log.debug(strLen); */

			//var usageAmt = usageAmtStr.indexOf('#')== -1
			/* if(usageAmtStr.indexOf('#') == -1)
			{
				log.debug("if..");
				var usageAmountVal = usageAmtStr.split('#');
				log.debug("usageAmountVal",usageAmountVal);
			} */
			var usageArr = [];

			/* for(var i=0;i<usageAmtStr;i++)
		{
		var usageAmountVal = usageAmtStr.split('#');
		log.debug(usageAmountVal);
		usageAmount = usageAmountVal[i]+".00";
		usageArr.push(usageAmountVal);
		} */
			/* 
			log.debug("new amount",usageArr);
			log.debug("new amount here",usageAmount);   */


			var id = record.submitFields({
				type: record.Type.INVOICE,
				id: rec_id,
				values: {
					custbody_usage_units: usageUnit,
					custbody_pooled_data: accessPooledData
					//custbody_total_quantity: usageQuantity
				},
				options: {
					enableSourcing: false,
					ignoreMandatoryFields: true
				}
			});

			log.debug('record saved as', id);
			
			}catch(error)
			{
				log.debug("Error",error);
			}

		}

		return {
			beforeLoad: beforeLoad,
			afterSubmit: afterSubmit
		};
	});