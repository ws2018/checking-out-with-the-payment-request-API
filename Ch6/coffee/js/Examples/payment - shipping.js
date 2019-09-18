window.onload = function(e) {
  const paymentMethods = [{
    supportedMethods: 'basic-card',
    data: {
      supportedNetworks: ['visa', 'mastercard', 'amex']
    }
  }];

  function updateDetails(details, shippingAddress, callback, stotal) {
    let shippingOption = {
      id: '',
      label: '',
      amount: {currency: 'USD', value: '0.00'},
      selected: true,
      pending: false,
    };
    if (shippingAddress.country === 'US') {
      if (shippingAddress.region === 'CA') {
        shippingOption.id = 'californiaFreeShipping';
        shippingOption.label = 'Free shipping in California';
        details.total.amount.value = (Number(stotal)).toFixed(2);
      } else {
        shippingOption.id = 'unitedStatesStandardShipping';
        shippingOption.label = 'Standard shipping in US';
        shippingOption.amount.value = '2.99';
        details.total.amount.value = (Number(stotal) + Number(3.99)).toFixed(2);
      }
      details.shippingOptions = [shippingOption];
      delete details.error;
    } else {
      // Don't ship outside of US for the purposes of this example.
      shippingOption.label = 'Shipping';
      shippingOption.pending = true;
      details.total.amount.value = (Number(stotal)).toFixed(2);
      details.error = 'Sorry - cannot ship outside of USA.';
      delete details.shippingOptions;
    }
    details.displayItems.splice(1, 1, shippingOption);
    callback(details);
  }  

  // configure payment request API
  document.querySelector(".chkoutbutton").addEventListener("click", function(e) {
    if (document.querySelector(".chkoutbutton").classList.contains("enabled")) {
      document.getElementById("message").className = '';
      
      if (window.PaymentRequest) {
        let subtotal = Number(document.querySelector(".total-price").innerText);
        let shipping = 2.99;
        let tax = (subtotal + shipping) * 0.175;
        let total = Number(subtotal) + Number(tax) + Number(shipping);

        const paymentDetails = {
          total: {
            label: 'Total to pay by card',
            amount: { currency: 'USD', value:  total.toFixed(2) }
          },
          displayItems: [{
            label: 'Coffee capsules',
            amount: { currency: 'USD', value: subtotal.toFixed(2) }
          },{        
            label: 'Standard shipping in US',
            amount: { currency: 'USD', value: shipping.toFixed(2) }
          }, {        
            label: 'Sales Tax',
            amount: { currency: 'USD', value: tax.toFixed(2) }
          }],
        };   

        const paymentOptions = { requestPayerEmail: true, requestShipping: true };
        let request = new PaymentRequest(paymentMethods, paymentDetails, paymentOptions);

        request.addEventListener('shippingaddresschange', function(evt) {
          evt.updateWith(new Promise(function(resolve) {
            updateDetails(paymentDetails, request.shippingAddress, resolve, total);
          }));
        });    

        request.addEventListener('shippingoptionchange', function(evt) {
          evt.updateWith(new Promise(function(resolve, reject) {
            updateDetails(paymentDetails, request.shippingOption, resolve, reject, total);
          }));
        });

        if (request.canMakePayment) {
          request.canMakePayment().then(function(result) {
            if (result) {
              request.show().then(function(result) {
                result.complete('success').then(function() {
                  console.log(JSON.stringify(result));
                });      
              }).catch(function(err) {    
                console.error(err.message);
              });          
            } else {
              console.log('Cannot make payment');
            }
          }).catch(function(err) {
            console.log(request, err);
          });
        }
      }
    }
  });
};
