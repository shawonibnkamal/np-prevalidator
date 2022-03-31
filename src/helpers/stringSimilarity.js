const levenshtein = require('js-levenshtein');

const checkType = (c) => {
    if (/^[a-zA-Z]+$/.test(c)) {
        return "alpha";
    } else if (c.match(/^[0-9]+$/) != null) {
        return "digit";
    } else {
        return null;
    }
}

const similarStringsHelper = (str) => {
    list = new Set();

    curr = "";
    for (let x = 0; x < str.length-1; x++) {
        c1 = str[x];
        c2 = str[x+1];

        if (checkType(c1) != null) {
            curr += c1;
        }

        // change of alpha to other
        if (checkType(c1) != checkType(c2)) {
            if (curr != "") {
                list.add(curr);
            }
            curr = "";
        }
        
        // change of digit to other
    }
    if (checkType(c2) != null) {
        curr += c2;
        if (curr != "") {
            list.add(curr);
        }
    }
    
    //console.log(list);
    return list;
}

exports.stringSimilarity = function(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    res = 1;

    l1 = similarStringsHelper(s1);
    l2 = similarStringsHelper(s2);

    if (l1.size > l2.size) {
        l2.forEach((key) => {
            if (!l1.has(key)) {
                res += 1;
            }
        });
    } else {
        l1.forEach((key) => {
            if (!l2.has(key)) {
                res += 1;
            }
        });
    }
    

    return res * levenshtein(s1, s2);
}