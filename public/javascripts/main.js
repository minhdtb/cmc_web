let PROMPT = 'InfoSec> ';

function RGBColor(R, G, B) {
    if (typeof R === 'undefined')
        R = 0;
    if (typeof G === 'undefined')
        G = 0;
    if (typeof B === 'undefined')
        B = 0;

    return {
        R: R,
        G: G,
        B: B
    }
}

function createColorRange(c1, c2) {
    let colorList = [], tmpColor;
    for (let i = 0; i < 255; i++) {
        tmpColor = RGBColor(c1.R + ((i * (c2.R - c1.R)) / 255),
            c1.G + ((i * (c2.G - c1.G)) / 255),
            c1.B + ((i * (c2.B - c1.B)) / 255));
        colorList.push(tmpColor);
    }

    return colorList;
}

function getCenterPoint(object) {
    if (object) {
        let bbox = object.getBBox();
        return {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2
        }
    } else {
        return {
            x: 0, y: 0
        }
    }
}

let lastLine;

function drawLine(p1, p2) {
    if (lastLine) {
        lastLine.remove();
    }

    lastLine = d3.select('#map-world')
        .select('g')
        .append('line')
        .attr('x1', p1.x)
        .attr('y1', p1.y)
        .attr('x2', p2.x)
        .attr('y2', p2.y)
        .attr('style', 'stroke: red; stroke-width: 2');
}

$(document).ready(() => {
    let terminalLog = $('#terminal');
    let terminal;

    if (terminalLog.length) {
        terminal = terminalLog.terminal(function () {
        }, {
            greetings: false,
            height: 100,
            prompt: PROMPT
        });
    }

    let red = RGBColor(255, 0, 0);
    let white = RGBColor(255, 255, 255);
    let colors = createColorRange(red, white);

    let client = mqtt.connect('wss://mqtt.esminer.com:8083', {
        username: 'minhdtb',
        password: '123456'
    });

    client.on('connect', () => console.log('Message client is connected.'));
    client.subscribe('message');
    client.subscribe('blacklist');

    client.on('message', (topic, message) => {

        let data = JSON.parse(message.toString());
        if (topic === 'message') {
            let objectCountry = d3.select('#map-world')
                .select('#' + data.countryCode.toUpperCase());

            let objectRemoteCountry = d3.select('#map-world')
                .select('#' + data.remoteCountryCode.toUpperCase());

            if (objectCountry && objectRemoteCountry) {
                let countryPoint = getCenterPoint(objectCountry.node());
                let remotePoint = getCenterPoint(objectRemoteCountry.node());
                if (remotePoint.x === 0 && remotePoint.y === 0)
                    remotePoint = countryPoint;

                drawLine(countryPoint, remotePoint);
            }

            let objectVietNamRegion = null;

            if (data.countryCode === 'vn') {
                objectVietNamRegion = d3.select('#map-viet-nam')
                    .select('#VN-' + data.regionCode);
            }

            let index = 0;

            function rotateColors() {
                let currentColor = colors[index];
                let color = "rgb(" + currentColor.R + "," + currentColor.G + "," + currentColor.B + ")";

                if (objectCountry) {
                    objectCountry.style('fill', color);
                }

                if (objectRemoteCountry) {
                    objectRemoteCountry.style('fill', color);
                }

                if (objectVietNamRegion) {
                    objectVietNamRegion.style('fill', color);
                }

                index++;
                if (index < colors.length)
                    setTimeout(rotateColors, 10);
            }

            rotateColors();

            if (terminal) {
                terminal.echo(PROMPT + `[[b;gray;]${moment(new Date()).format('DD/MM/YYYY HH:mm:ss')}] - [[b;green;]Malware Detected] - Name: [[b;red;]` + data.name + ']');
            }
        } else if (topic === 'blacklist') {
            if (terminal) {
                terminal.echo(PROMPT + `[[b;gray;]${moment(new Date()).format('DD/MM/YYYY HH:mm:ss')}] - [[b;blue;]Black Host Detected] - Remote Host: [[b;red;]` + data.remoteHost + ']');
            }
        }
    });
    
    $('#console').draggable();

    d3.selectAll('path')
        .on('mouseover', function () {
            d3.select(this).style('fill', '#ccc');
        });

    d3.selectAll('path')
        .on('mouseleave', function () {
            d3.select(this).style('fill', 'white');
        });

    let popup = $('#popup');
    let content = $('#content');
    content.html('');

    let badgeMalware = $('.badge.malware');
    badgeMalware.on('mouseenter', event => {
        event.preventDefault();
        popup.css('left', $(event.target).offset().left + 50);
        popup.css('top', $(event.target).offset().top);
        let name = $(event.target).data('name');
        content.html('');
        $.get('/api/get-region?name=' + name, (data) => {
            _.each(data, function (item, i) {
                let tr = $('<tr>');
                let td = $('<td>').attr('class', 'col-index').text(i + 1);
                tr.append(td);

                td = $('<td>').attr('class', 'col-flag').append($('<span>').attr('class', 'flag-icon flag-icon-' + item.countryCode));
                tr.append(td);

                td = $('<td>').text(item.regionName ? item.regionName : '-');
                tr.append(td);

                td = $('<td>').attr('class', 'col-badge').append($('<span>').attr('class', 'badge label-danger').text(item.count));
                tr.append(td);

                content.append(tr);
            });

            popup.show();
        });
    });

    badgeMalware.on('mouseleave', event => {
        event.preventDefault();
        popup.hide();
    });

    let badgeRemote = $('.badge.remote');
    badgeRemote.on('mouseenter', event => {
        event.preventDefault();
        popup.css('left', $(event.target).offset().left + 50);
        popup.css('top', $(event.target).offset().top);
        let remoteHost = $(event.target).data('host');
        content.html('');
        $.get('/api/get-malware-remote?remoteHost=' + remoteHost, (data) => {
            _.each(data, function (item, i) {
                let tr = $('<tr>');
                let td = $('<td>').attr('class', 'col-index').text(i + 1);
                tr.append(td);

                td = $('<td>').text(item.name);
                tr.append(td);

                td = $('<td>').attr('class', 'col-badge').append($('<span>').attr('class', 'badge label-danger').text(item.count));
                tr.append(td);

                content.append(tr);
            });

            popup.show();
        });
    });

    badgeRemote.on('mouseleave', event => {
        event.preventDefault();
        popup.hide();
    });

    let badgeRegion = $('.badge.region');
    badgeRegion.on('mouseenter', event => {
        event.preventDefault();
        let countryCode = $(event.target).data('country-code');
        let regionCode = $(event.target).data('region-code');
        content.html('');
        $.get('/api/get-malware-region?countryCode=' + countryCode + '&regionCode=' + regionCode, (data) => {
            _.each(data, function (item, i) {
                let tr = $('<tr>');
                let td = $('<td>').attr('class', 'col-index').text(i + 1);
                tr.append(td);

                td = $('<td>').text(item.name);
                tr.append(td);

                td = $('<td>').attr('class', 'col-badge').append($('<span>').attr('class', 'badge label-danger').text(item.count));
                tr.append(td);

                content.append(tr);
            });

            popup.css('left', $(event.target).offset().left - popup.width());
            popup.css('top', $(event.target).offset().top);
            popup.show();
        });
    });

    badgeRegion.on('mouseleave', event => {
        event.preventDefault();
        popup.hide();
    });

    $('#table-malware').dataTable({
        bAutoWidth: false,
        aoColumns: [
            {sWidth: '5%'},
            {sWidth: '85%'},
            {sWidth: '10%'},
        ]
    });

    $('#table-region').dataTable({
        bAutoWidth: false,
        aoColumns: [
            {sWidth: '5%'},
            {sWidth: '45%'},
            {sWidth: '40%'},
            {sWidth: '10%'},
        ]
    });

    $('#table-remote').dataTable({
        bAutoWidth: false,
        aoColumns: [
            {sWidth: '5%'},
            {sWidth: '85%'},
            {sWidth: '10%'},
        ]
    });


});