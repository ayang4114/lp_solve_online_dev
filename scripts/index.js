// Sets whether the project is in development or in production
const dev = true
const LP_SOLVE_API = dev ? "http://localhost:5000/" : "https://peaceful-zion-91234.herokuapp.com/"


$(document).ready(() => {

  /**
   * Constants in the website. HTML/CSS ids are stored as key => value mappings.
   * HTML/CSS class names are stored in the {@var SYS.class} property.
   */
  const SYS = {
    TEXTSPACE: '#textspace',
    SOURCE: '#source',
    MATRIX: '#matrix',
    MATRIX_INPUT: '#matrix-input',
    LP_MATRIX: '#lp-matrix',
    OPTIONS: '#options',
    RESULT: '#result',
    RESULT_DASH: '#result-dash',
    OBJECTIVE: '#objective',
    CONSTRAINTS: '#constraints',
    SENSITIVITY: '#sensitivity',
    DOWNLOAD_REPORT: '#download-report',
    DOWNLOAD: '#download',
    LOG: '#log',
    UPLOAD: '#upload',
    RUN: '#run',
    VAR_COUNT: '#variable-count',
    CONSTRAINT_COUNT: '#constraint-count',
    MATRIX_BODY: '#matrix-body',
    class: {
      RESULT_TABS: '.result-tab',
      TAB_BUTTONS: '.tab-button',
      CONSTRAINT_EQ: '.constraint-equations',
    }
  }
  const EQUALITY_OPTIONS = '<td><select><option> ≤ </option><option> ≥ </option><option> = </option><option> > </option><option> < </option></select></td><td><input type="number"/></td>'


  /**
   * Records the current state of the website
   */
  let state = {
    current: SYS.SOURCE,
    'constraint-count': $(SYS.CONSTRAINT_COUNT).val(),
    'variable-count': $(SYS.VAR_COUNT).val()
  }
  $(SYS.MATRIX_INPUT).hide()

  /**
   * Updates the log with a new message. This message is to displayed following
   * all of the previous log messages.
   * @param {string} content The output to be displayed in the log.
   */
  function updateLog(content) {
    $(SYS.LOG).val(`${$(SYS.LOG).val()}${content}\n`)
  }

  /**
   * Displays the text given an HTML/CSS id value onto the website textspace
   * box.
   * @param {string} element The id value of an HTML/CSS element.
   */
  function displayTextIn(element) {
    $(SYS.TEXTSPACE).val($(element).val())
  }

  /**
   * Stores the content in the website textspace in the hidden value of an
   * HTML/CSS element.
   * @param {string} element The id value of an HTML/CSS element.
   */
  function storeTextIn(element) {
    $(element).val($(SYS.TEXTSPACE).val())
  }

  /**
   * Changes the state of the website to the value of the next HTML/CSS 
   * element id.
   * @param {string} element The id value of an HTML/CSS element.
   */
  function setNextStateAs(element) {
    state.current = element
  }

  /**
   * Returns the value stored in an HTML/CSS id.
   * @param {string} element The id value of an HTML/CSS element.
   */
  function valueOf(element) {
    return $(element).val()
  }

  /**
   * True if the current state is equal to an HTML/CSS element's id value. 
   * False otherwise.
   * @param {string} element The id value of an HTML/CSS element.
   */
  function currentStateIs(element) {
    return element === state.current
  }

  /**
   * Returns the id value of a pressed button event.
   * @param {Event} e 
   */
  function pressedButtonID(e) {
    const clicked_button = $(e.target)
    return `#${clicked_button[0].id}`
  }

  /**
   * When the upload button is clicked, users are prompted to select a file
   * in their file systems. If a file is selected, then the contents of that
   * file is displayed onto the website's text space.
   * 
   * The selected file must be a *.lp or a *.txt file. For any other files,
   * the operation is cancelled.
   */
  $(SYS.UPLOAD).click(() => {
    var input = document.createElement('input');
    input.type = 'file';
    document.body.appendChild(input)
    input.onchange = e => {
      var file = e.target.files[0]
      var filename = file.name
      var reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = readerEvent => {
        var content = readerEvent.target.result
        $(SYS.SOURCE).val(content)
        if (state.current === SYS.SOURCE) {
          $(SYS.TEXTSPACE).val(content)
        }
        updateLog(`Content from ${filename} is placed into source text space.\n`)
        document.body.removeChild(input)
      }
    }
    input.click();
  })

  /**
   * The values in {@var contents} are turned into files, where the filenames
   * for each are their key values. These files are then downloaded into the 
   * user's file systems.
   * @param {Map<String, String>} contents 
   */
  function downloadForUser(contents) {
    var a = document.createElement('a')
    for (var name in contents) {
      var file = new Blob([contents[name]], { type: 'text/plain' })
      a.href = URL.createObjectURL(file)
      a.download = name
      document.body.appendChild(a)
      a.click()
      updateLog(`${name} Downloaded...\n`)
    }
    setTimeout(function () {
      document.body.removeChild(a)
    }, 0)
  }

  /**
   * Download the report of a lp_solve calculation as one file named report.txt.
   */
  $(SYS.DOWNLOAD_REPORT).click(() => {
    downloadForUser({ 'report.txt': valueOf(SYS.DOWNLOAD_REPORT) })
  })

  /**
   * Download the contents of the source text space as a file named lp_solve.txt
   */
  $(SYS.DOWNLOAD).click(() => {
    if (currentStateIs(SYS.SOURCE)) {
      storeTextIn(SYS.SOURCE)
    }
    downloadForUser({ 'lp_solve.txt': valueOf(SYS.SOURCE) })
  })

  function buildConstraintRowHTML() {
    let row = document.createElement('tr')
    let html = '<td>Constraint</td>'
    for (var i = 0; i < state['variable-count']; i++) {
      html += '<td><input type="number"></td>'
    }
    row.innerHTML = html + EQUALITY_OPTIONS
    return row
  }

  /**
   * Precondition: The count of variables is always at least 1.
   */
  $(SYS.VAR_COUNT).change(function () {

    const newNode = '<td><input type="number"></td>'

    console.log($(this).val())
    const children = $(SYS.MATRIX_BODY)[0].children
    for (var child of children) {
      console.log($(child))
    }
  })

  $(SYS.CONSTRAINT_COUNT).change(function () {
    const value = $(this).val()
    if (value < 0) { return }

    const id = $(this)[0].id
    const diff = value - state[id]
    state[id] = value

    operation = {
      incr: () => {
        const row = buildConstraintRowHTML()
        $(SYS.MATRIX_BODY)[0].appendChild(row)
      },
      decr: () => {
        const lastChild = $(SYS.MATRIX_BODY)[0].lastChild
        $(SYS.MATRIX_BODY)[0].removeChild(lastChild)
      }
    }
    var performedOperation = diff > 0 ? operation.incr : operation.decr
    for (var i = 0; i < Math.abs(diff); i++)
      performedOperation()
  })

  /**
   * Connects to the lp_solve_server, which performs the linear programming
   * calculations, and receives the results from those calculations.
   * 
   * If there are no errors, then the log will message the user that the
   * running is complete.
   * Otherwise, the log message will display the error message preformed by 
   * lp_solve.
   * 
   * If the website is unable to connect to the server, then log that the server
   * could not be connected.
   * 
   * {@var response = {
   *    report: [Object]
   *    error: [String]
   *    lp_solve_error: [String]
   * }}
   * 
   */
  $(SYS.RUN).click(() => {
    // If currently on source, first save all current progress.
    if (currentStateIs(SYS.SOURCE)) {
      storeTextIn(SYS.SOURCE)
    }

    var request_data = { content: valueOf(SYS.SOURCE) }

    updateLog('Now Running...')

    fetch(LP_SOLVE_API, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow', // manual, *follow, error
      referrer: 'no-referrer', // no-referrer, *client
      body: JSON.stringify(request_data), // body data type must match "Content-Type" header
    }).then(response => {
      return response.json()
    }).then(res => {
      const SOLUTION = res.result.solution
      updateLog('Running Complete.\n')
      $(SYS.DOWNLOAD_REPORT).val(res.result.solution)
      $(SYS.OBJECTIVE).val(SOLUTION)
      displayTextIn(state.current)
      console.log(res)
      // if (res.error === '') {
      //   updateLog('Running Complete.\n')
      // } else {
      //   updateLog(res.lp_solve_error)
      //   return
      // }

      // var sections = res.report
      // var mapping = {
      //   'Actual values of the constraints': SYS.CONSTRAINTS,
      //   'Model name': SYS.OBJECTIVE,
      //   'Objective function limits': SYS.SENSITIVITY,
      // }
      // for (var section in sections) {
      //   var tab = mapping[section]
      //   $(tab).val(sections[section])
      // }
      // $(SYS.DOWNLOAD_REPORT).val(res.result)
      // displayTextIn(state.current)
    }).catch(function (_) {
      updateLog('Unable to connect to the server...')
    })
  })

  function setMatrixState(status) {
    var _ = status ? $(SYS.MATRIX_INPUT).show() : $(SYS.MATRIX_INPUT).hide()
    var _ = status ? $(SYS.TEXTSPACE).hide() : $(SYS.TEXTSPACE).show()
  }

  /**
   * Changes the content of the text area into the values associated to the 
   * button clicked.
   */
  $(SYS.class.TAB_BUTTONS).click((e) => {
    storeTextIn(state.current)

    setNextStateAs(pressedButtonID(e))
    if (currentStateIs(SYS.RESULT)) {
      $(SYS.RESULT_DASH).show()
      setNextStateAs(SYS.OBJECTIVE)
    } else {
      $(SYS.RESULT_DASH).hide()
    }


    if (currentStateIs(SYS.MATRIX)) {
      setMatrixState(true)
      return
    } else {
      setMatrixState(false)
    }
    displayTextIn(state.current)

    $(SYS.TEXTSPACE).attr('readonly', !currentStateIs(SYS.SOURCE))
    console.log('Assertion', !currentStateIs(SYS.RESULT))
  })

  /**
   * Changes the content of the text area into the values associated to the 
   * button clicked.
   */
  $(SYS.class.RESULT_TABS).click(e => {
    var next_tab = pressedButtonID(e)
    storeTextIn(state.current)
    setNextStateAs(next_tab)
    displayTextIn(state.current)
  })
})
