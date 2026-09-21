// ============================================================
// API SERVICE
// Google Apps Script Backend
// JSONP GET + IFRAME FORM POST
// ============================================================

class ApiService {

  // ==========================================================
  // GET
  // ใช้ JSONP เพื่อหลีกเลี่ยง CORS
  // ==========================================================

  static get(
    action,
    params = {}
  ) {

    return new Promise(
      function (resolve) {

        const callbackName =
          'sportsScienceCallback_' +
          Date.now() +
          '_' +
          Math.floor(
            Math.random() * 100000
          );


        const script =
          document.createElement(
            'script'
          );


        const query =
          new URLSearchParams();


        // ----------------------------------------------------
        // Action
        // ----------------------------------------------------

        query.set(
          'action',
          action
        );


        // ----------------------------------------------------
        // Token
        // ----------------------------------------------------

        query.set(
          'token',
          CONFIG.API_TOKEN
        );


        // ----------------------------------------------------
        // Parameters
        // ----------------------------------------------------

        Object.keys(
          params || {}
        ).forEach(
          function (key) {

            if (
              params[key] !==
              undefined &&
              params[key] !==
              null
            ) {

              query.set(
                key,
                params[key]
              );
            }
          }
        );


        // ----------------------------------------------------
        // Callback
        // ----------------------------------------------------

        query.set(
          'callback',
          callbackName
        );


        const url =
          CONFIG.API_URL +
          '?' +
          query.toString();


        let completed =
          false;


        // ----------------------------------------------------
        // Cleanup
        // ----------------------------------------------------

        function cleanup() {

          try {

            delete window[
              callbackName
            ];

          } catch (e) {}


          if (
            script &&
            script.parentNode
          ) {

            script.parentNode
              .removeChild(
                script
              );
          }
        }


        // ----------------------------------------------------
        // Success
        // ----------------------------------------------------

        window[
          callbackName
        ] =
          function (data) {

            if (completed) {
              return;
            }


            completed = true;


            cleanup();


            resolve(data);
          };


        // ----------------------------------------------------
        // Error
        // ----------------------------------------------------

        script.onerror =
          function () {

            if (completed) {
              return;
            }


            completed = true;


            cleanup();


            console.error(
              'API GET Error:',
              action
            );


            if (
              typeof Swal !==
              'undefined'
            ) {

              Swal.fire(
                'ข้อผิดพลาด',
                'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
                'error'
              );
            }


            resolve(null);
          };


        // ----------------------------------------------------
        // Timeout
        // ----------------------------------------------------

        const timeout =
          setTimeout(
            function () {

              if (completed) {
                return;
              }


              completed = true;


              cleanup();


              console.error(
                'API GET Timeout:',
                action
              );


              if (
                typeof Swal !==
                'undefined'
              ) {

                Swal.fire(
                  'หมดเวลา',
                  'เซิร์ฟเวอร์ใช้เวลาตอบกลับนานเกินไป',
                  'warning'
                );
              }


              resolve(null);

            },
            CONFIG.JSONP_TIMEOUT ||
            15000
          );


        // ----------------------------------------------------
        // Wrap callback to clear timeout
        // ----------------------------------------------------

        const originalCallback =
          window[callbackName];


        window[
          callbackName
        ] =
          function (data) {

            clearTimeout(
              timeout
            );


            originalCallback(
              data
            );
          };


        // ----------------------------------------------------
        // Start request
        // ----------------------------------------------------

        script.src =
          url;

        script.async =
          true;


        document.head.appendChild(
          script
        );

      }
    );
  }


  // ==========================================================
  // POST
  //
  // ใช้ Hidden IFrame + HTML Form
  // ไม่ใช้ fetch เพื่อหลีกเลี่ยง CORS
  // ==========================================================

  static post(
    action,
    payload = {}
  ) {

    return new Promise(
      function (resolve) {

        const iframeName =
          'sportsScienceIframe_' +
          Date.now() +
          '_' +
          Math.floor(
            Math.random() * 100000
          );


        // ----------------------------------------------------
        // IFrame
        // ----------------------------------------------------

        const iframe =
          document.createElement(
            'iframe'
          );


        iframe.name =
          iframeName;

        iframe.id =
          iframeName;


        iframe.style.display =
          'none';


        iframe.setAttribute(
          'aria-hidden',
          'true'
        );


        document.body.appendChild(
          iframe
        );


        // ----------------------------------------------------
        // Form
        // ----------------------------------------------------

        const form =
          document.createElement(
            'form'
          );


        form.method =
          'POST';


        form.action =
          CONFIG.API_URL;


        form.target =
          iframeName;


        form.style.display =
          'none';


        // ----------------------------------------------------
        // Add field
        // ----------------------------------------------------

        function addField(
          name,
          value
        ) {

          const input =
            document.createElement(
              'input'
            );


          input.type =
            'hidden';


          input.name =
            name;


          input.value =
            value ===
            undefined ||
            value ===
            null
              ? ''
              : String(value);


          form.appendChild(
            input
          );
        }


        // ----------------------------------------------------
        // Action
        // ----------------------------------------------------

        addField(
          'action',
          action
        );


        // ----------------------------------------------------
        // Token
        // ----------------------------------------------------

        addField(
          'token',
          CONFIG.API_TOKEN
        );


        // ----------------------------------------------------
        // Payload
        // ----------------------------------------------------

        Object.keys(
          payload || {}
        ).forEach(
          function (key) {

            const value =
              payload[key];


            // ------------------------------------------------
            // รองรับ object / array
            // ------------------------------------------------

            if (
              typeof value ===
              'object' &&
              value !== null
            ) {

              addField(
                key,
                JSON.stringify(
                  value
                )
              );

            } else {

              addField(
                key,
                value
              );
            }
          }
        );


        document.body.appendChild(
          form
        );


        let completed =
          false;


        // ----------------------------------------------------
        // Message listener
        // ----------------------------------------------------

        function messageHandler(
          event
        ) {

          // ตรวจ source
          if (
            event.source !==
            iframe.contentWindow
          ) {

            return;
          }


          const data =
            event.data;


          if (
            !data ||
            data.source !==
            'SPORTS_SCIENCE_API'
          ) {

            return;
          }


          if (completed) {
            return;
          }


          completed = true;


          cleanup();


          resolve(
            data.data
          );
        }


        window.addEventListener(
          'message',
          messageHandler
        );


        // ----------------------------------------------------
        // Cleanup
        // ----------------------------------------------------

        function cleanup() {

          window.removeEventListener(
            'message',
            messageHandler
          );


          try {

            if (
              form &&
              form.parentNode
            ) {

              form.parentNode
                .removeChild(
                  form
                );
            }

          } catch (e) {}


          try {

            if (
              iframe &&
              iframe.parentNode
            ) {

              iframe.parentNode
                .removeChild(
                  iframe
                );
            }

          } catch (e) {}
        }


        // ----------------------------------------------------
        // Timeout
        // ----------------------------------------------------

        const timeout =
          setTimeout(
            function () {

              if (completed) {
                return;
              }


              completed = true;


              cleanup();


              console.error(
                'API POST Timeout:',
                action
              );


              if (
                typeof Swal !==
                'undefined'
              ) {

                Swal.fire(
                  'หมดเวลา',
                  'ไม่สามารถรอผลการบันทึกข้อมูลจากเซิร์ฟเวอร์ได้',
                  'warning'
                );
              }


              resolve(null);

            },
            CONFIG.POST_TIMEOUT ||
            20000
          );


        // ----------------------------------------------------
        // Clear timeout when message received
        // ----------------------------------------------------

        const originalHandler =
          messageHandler;


        window.removeEventListener(
          'message',
          messageHandler
        );


        function finalMessageHandler(
          event
        ) {

          if (
            event.source !==
            iframe.contentWindow
          ) {

            return;
          }


          const data =
            event.data;


          if (
            !data ||
            data.source !==
            'SPORTS_SCIENCE_API'
          ) {

            return;
          }


          clearTimeout(
            timeout
          );


          window.removeEventListener(
            'message',
            finalMessageHandler
          );


          if (completed) {
            return;
          }


          completed = true;


          cleanup();


          resolve(
            data.data
          );
        }


        window.addEventListener(
          'message',
          finalMessageHandler
        );


        // ----------------------------------------------------
        // Submit
        // ----------------------------------------------------

        try {

          form.submit();

        } catch (error) {

          clearTimeout(
            timeout
          );


          completed = true;


          cleanup();


          console.error(
            'API POST Error:',
            error
          );


          if (
            typeof Swal !==
            'undefined'
          ) {

            Swal.fire(
              'ข้อผิดพลาด',
              'ไม่สามารถส่งข้อมูลไปยังเซิร์ฟเวอร์ได้',
              'error'
            );
          }


          resolve(null);
        }

      }
    );
  }
}


// ============================================================
// GLOBAL TEST FUNCTION
// เปิด Console แล้วใช้:
// testAPI()
// ============================================================

async function testAPI() {

  console.log(
    '========================================'
  );

  console.log(
    'SPORTS SCIENCE API TEST'
  );

  console.log(
    'API:',
    CONFIG.API_URL
  );


  const result =
    await ApiService.get(
      'getDashboardStats'
    );


  console.log(
    'RESULT:',
    result
  );


  return result;
}
