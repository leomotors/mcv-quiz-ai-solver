/**
<li>
  <div class="cvqs-qstn-wrapper form" qstn_nid="1334905">
    <div class="cvqs-inner">
      <div class="cvqs-qstn-weight"><div data-part="weight">15</div></div>
      <div class="cvqs-qstn-content">
        <div class="cvqs-qstn-question">
          <p
            dir="ltr"
            style="
              margin: 0pt 0px 10pt;
              color: rgb(0, 0, 0);
              font-family: sans-serif;
              font-size: 12px;
              background-color: rgb(205, 255, 197);
              line-height: 1.38;
              text-align: justify;
            "
          >
            <span
              ><span
                style="
                  font-size: 13pt;
                  font-family: Calibri, sans-serif;
                  vertical-align: baseline;
                "
                >To make this state behavioral machine valid, transitions
                between object states must be added.&nbsp;</span
              ></span
            >
          </p>

          <div>
            <br /><img
              alt=""
              src="https://lh4.googleusercontent.com/EEODusgKVz4gzIPE4KAWLj5XqDg0rMBvSCRP9jncwdKfCz7Z8sxa7Au17d6lNQ1hF65_cirlRGXxge_qNgDLNcYO37ngl46sy8p5Neee4Mb1vQwQflposOVQtHI7mz3l1UN49YceXatnvxw46Q=s0"
              style="width: 350px; height: 144px"
            />
          </div>
        </div>
        <div class="cvqs-qstn-instruction"></div>
        <div class="cvqs-qstn-answer-wrapper">
          <div class="cvqs-answer-multiplechoice">
            <fieldset>
              <legend class="cvqs-answer-instruction">Pick a choice:</legend>
              <div class="cvqs-answer-multiplechoice-choiceitem">
                <label>
                  <input
                    type="radio"
                    name="cvqs-answer-1334905"
                    value="TRUE"
                    class="cvqs-to-post"
                    qstn_type="2"
                  />
                  <span class="cvqs-answer-multiplechoice-content">TRUE</span>
                </label>
              </div>
              <div class="cvqs-answer-multiplechoice-choiceitem">
                <label>
                  <input
                    type="radio"
                    name="cvqs-answer-1334905"
                    value="FALSE"
                    class="cvqs-to-post"
                    qstn_type="2"
                  />
                  <span class="cvqs-answer-multiplechoice-content">FALSE</span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>
        <!--/.cvqs-qstn-answer-wrapper-->
        <div class="cvqs-qstn-info-on-point" data-mode="form">
          <div class="cvqs-qstn-info-on-point-content-form cvui-padded">
            <div data-part="point-unit">
              <span data-part="point">1</span>
              <span data-part="unit">point</span>
            </div>
          </div>
        </div>
      </div>
      <!--/.cvqs-qstn-content-->
    </div>
    <!--/.cvqs-inner-->
  </div>
  <!--/.cvqs-qstn-wrapper-->
</li>
 */

export type Question = {
  qno: string;
  question: string;
  answers: string[];
  imageSrcs: string[];
};

export function parseQuestion(element: HTMLLIElement): Partial<Question> {
  const qno = element.querySelector(".cvqs-qstn-weight")?.textContent?.trim();

  const question = element
    .querySelector(".cvqs-qstn-question")
    ?.textContent?.trim();

  const answers = Array.from(
    element.querySelectorAll(".cvqs-answer-multiplechoice-choiceitem"),
  )
    .map((choice) => choice.textContent?.trim())
    .filter(Boolean) as string[];

  const imageSrcs = Array.from(element.querySelectorAll("img")).map(
    (img) => img.src,
  );

  return {
    qno,
    question,
    answers,
    imageSrcs,
  };
}

export function isQuestionOk(
  question: Partial<Question>,
  errorMsg: string[],
): question is Question {
  let passed = true;

  if (question.qno === undefined) {
    errorMsg.push("Question number is missing");
    passed = false;
  }

  if (question.question === undefined) {
    errorMsg.push(`Question #${question.qno}: Question is missing`);
    passed = false;
  }

  if (question.answers === undefined || question.answers.length === 0) {
    errorMsg.push(`Question #${question.qno}: Answers are missing`);
    passed = false;
  }

  return passed;
}
