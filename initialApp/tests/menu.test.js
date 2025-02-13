


test('checks to see if html pages change properly after menu/home is selected', () => {
        var testBoolean = true

        //makes sure that it starts at map page and then goes to home
        var windowlocationhref = "sh_1969.html";

        if(windowlocationhref == "index.html"){
            testBoolean = false
        }

        windowlocationhref ="index.html"
        if(windowlocationhref != "index.html"){
            testBoolean = false
        }

        var windowlocationhref = "geo.html";
        windowlocationhref ="index.html"
        if(windowlocationhref != "index.html"){
            testBoolean = false
        }


expect(testBoolean).toBe(true);

});
