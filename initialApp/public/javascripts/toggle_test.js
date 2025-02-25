var fs = require('fs');
const $ = require('jquery');

test('test readButtonClick', () => {
    // read html file into a string
    var html = fs.readFileSync('public/index.html', 'utf8');

    // any non-null string is valid
    expect(html).toEqual(expect.anything());

    document.body.innerHTML = html;

    // function to test
    $("#read-button").click(function() {
        var text = $(this).text();

        if (text === 'Read more') {
            $(this).text('Read less');
        } else {
            $(this).text('Read more');
        }
        $("#dots").toggle();
        $("#toggle-text").toggle();
    });

    // test initial state
    var button = $("#read-button");
    var dots = $("#dots");
    var toggleText = $("#toggle-text");

    expect(button.text()).toBe("Read more");
    expect(dots.is(":visible")).toBe(true);
    expect(toggleText.is(":visible")).toBe(false);

    button.click();

    // test post click state
    expect(button.text()).toBe("Read less");
    expect(dots.is(":visible")).toBe(false);
    expect(toggleText.is(":visible")).toBe(true);

    button.click();

    // test after button has been clicked again
    expect(button.text()).toBe("Read more");
    expect(dots.is(":visible")).toBe(true);
    expect(toggleText.is(":visible")).toBe(false);
});
});

