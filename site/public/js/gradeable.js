/**
 * Asynchronously load all of the templates
 * @return {Promise}
 */
function loadTemplates() {
    let templates = [
        {id: 'GradingGradeable', href: 'templates/grading/GradingGradeable.twig'},
        {id: 'Gradeable', href: "templates/grading/Gradeable.twig"},
        {id: 'GradingComponent', href: "templates/grading/GradingComponent.twig"},
        {id: 'Component', href: "templates/grading/Component.twig"},
        {id: 'Mark', href: "templates/grading/Mark.twig"},
        {id: 'OverallComment', href: "templates/grading/OverallComment.twig"},
        {id: 'TotalScoreBox', href: "templates/grading/TotalScoreBox.twig"},
        {id: 'ConflictMarks', href: "templates/grading/ConflictMarks.twig"}
    ];
    let promises = [];
    templates.forEach(function (template) {
        promises.push(new Promise(function (resolve, reject) {
            Twig.twig({
                id: template.id,
                href: template.href,
                allowInlineIncludes: true,
                async: true,
                error: function () {
                    reject();
                },
                load: function () {
                    resolve();
                }
            });
        }));
    });
    return Promise.all(promises);
}

/**
 * Calculates the score of a graded component
 * @param {Object} component
 * @param {Object} graded_component
 * @return {number}
 */
function calculateGradedComponentTotalScore(component, graded_component) {
    let markCount = 0;

    // Calculate the total
    let total = component.default;
    if (graded_component.custom_mark_selected) {
        total += graded_component.custom_mark_selected ? graded_component.score : 0.0;
        markCount++;
    }
    component.marks.forEach(function (mark) {
        if (graded_component.mark_ids.includes(mark.id)) {
            total += mark.points;
            markCount++;
        }
    });

    // If there were no marks earned, then there is no 'total'
    if (markCount === 0) {
        return undefined;
    }

    // Then clamp it in range
    return Math.min(component.upper_clamp, Math.max(total, component.lower_clamp));
}

function prepGradedComponent(component, graded_component) {
    if (graded_component === undefined) {
        return undefined;
    }

    // The custom mark selected property isn't set
    if (graded_component.custom_mark_selected === undefined) {
        graded_component.custom_mark_selected = graded_component.comment !== '';
    }

    // Calculate the total score
    if (graded_component.total_score === undefined) {
        graded_component.total_score = calculateGradedComponentTotalScore(component, graded_component);
    }

    // Unset blank properties
    if (graded_component.grader_id === '') {
        graded_component.grader_id = undefined;
    }
    if (graded_component.verifier_id === '') {
        graded_component.verifier_id = undefined;
    }

    return graded_component;
}

/**
 * Asynchronously render a gradeable using the passed data
 * @param {Object} gradeable
 * @param {Object} graded_gradeable
 * @returns {Promise}
 */
function renderGradingGradeable(gradeable, graded_gradeable) {
    return loadTemplates()
        .then(function () {
            // Calculate the total scores
            gradeable.components.forEach(function (component) {
                graded_gradeable.graded_components[component.id]
                    = prepGradedComponent(component, graded_gradeable.graded_components[component.id]);
            });

            // TODO: i don't think this is async
            return Twig.twig({ref: "GradingGradeable"}).render({
                'gradeable': gradeable,
                'graded_gradeable': graded_gradeable,
                'edit_marks_enabled': false,
                'grading_disabled': false // TODO:
            });
        });
}

/**
 * Asynchronously render a component using the passed data
 * @param {Object} component
 * @param {Object} graded_component
 * @param {boolean} editable True to render with edit mode enabled
 * @param {boolean} showMarkList True to display the mark list unhidden
 * @returns {Promise<string>} the html for the graded component
 */
function renderGradingComponent(component, graded_component, editable, showMarkList) {
    return new Promise(function (resolve, reject) {
        // Make sure we prep the graded component before rendering
        graded_component = prepGradedComponent(component, graded_component);

        // TODO: i don't think this is async
        resolve(Twig.twig({ref: "GradingComponent"}).render({
            'component': component,
            'graded_component': graded_component,
            'edit_marks_enabled': editable,
            'show_mark_list': showMarkList,
            'grading_disabled': false // TODO:
        }));
    });
}

function renderInstructorEditGradeable(gradeable) {

}

/**
 * Asynchronously renders the overall component using passed data
 * @param {string} comment
 * @param {boolean} editable If the comment should be open for edits, or closed
 * @return {Promise<string>}
 */
function renderOverallComment(comment, editable) {
    return new Promise(function (resolve, reject) {
        // TODO: i don't think this is async
        resolve(Twig.twig({ref: "OverallComment"}).render({
            'overall_comment': comment,
            'editable': editable,
            'disabled': false
        }));
    });
}

/**
 * Asynchronously renders the total scores box
 * @param {Object} scores
 * @return {Promise<string>}
 */
function renderTotalScoreBox(scores) {
    return new Promise(function (resolve, reject) {
        // TODO: i don't think this is async
        resolve(Twig.twig({ref: "TotalScoreBox"}).render(scores));
    });
}

/**
 *
 * @param conflict_marks
 * @return {Promise<string>}
 */
function renderConflictMarks(conflict_marks) {
    return new Promise(function (resolve, reject) {
        // TODO: i don't think this is async
        resolve(Twig.twig({ref: "ConflictMarks"}).render({conflict_marks: conflict_marks}));
    })
}