const Scriptures = (function () {
    "use strict";

    //---------------------------------CONSTANTS---------------------------------
    const BOTTOM_PADDING = "<br /><br />";
    const CLASS_BOOKS = "books";
    const CLASS_BUTTON = "btn";
    const CLASS_CHAPTER = "chapter";
    const CLASS_ICON = "material-icons"; // NEW
    const CLASS_VOLUME = "volume";
    const DIV_BREADCRUMBS = "crumbs";
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
    const DIV_SCRIPTURES = "scriptures";
    const ICON_NEXT = "skip_next"; // NEW
    const ICON_PREVIOUS = "skip_previous"; // NEW
    const INDEX_FLAG = 11;
    const INDEX_LATITUDE = 3;
    const INDEX_LONGITUDE = 4;
    const INDEX_PLACENAME = 2;
    const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    const NAVIGATION_TEXT = "The Scriptures";
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_HEADER5 = "h5";
    const TAG_LIST_ITEM = "li"; // NEW
    const TAG_SPAN = "span"; // NEW
    const TAG_UNORDERED_LIST = "ul"; // NEW
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;
    const ZOOM_LEVEL = 13;




    //---------------------------------PRIVATE VARIABLES---------------------------------
    let books;
    let gmLabels = [];
    let gmMarkers = [];
    let mapLabelsInitialized = false; // NEW
    let requestedBookId; // new
    let requestedChapter; // new
    let requestedNextPrevious; // new
    let volumes;


    //-------------------------PRIVATE METHOD DECLARATIONS---------------------------------
    let addMarker;
    let ajax;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let cacheBooks;
    let chaptersGrid;
    let chaptersGridContent;
    let clearMarkers;
    let encodedScripturesUrlParameters;
    let getScripturesCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    let htmlListItem; // new
    let htmlListItemLink; // new
    let init;
    let insertBreadCrumbs;
    let markerIndex; //
    let mergePlacename; //new
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let nextPreviousMarkup; //new
    let onHashChanged;
    let previousChapter;
    let setupMarkers;
    let setZoom;
    let showLocation;
    let titleForBookChapter;
    let volumeForId; // new
    let volumesGridContent;

    //---------------------------------PRIVATE METHODS---------------------------------
    
    addMarker = function (placename, latitude, longitude) {
        let index = markerIndex(latitude, longitude);

        if (index >= 0) {
            mergePlacename(placename, index);
        } else {
            let marker = new google.maps.Marker({
                position: {lat: Number(latitude), lng: Number(longitude)},
                map,
                title: placename,
                animation: google.maps.Animation.DROP
            });

            gmMarkers.push(marker);

            if (!mapLabelsInitialized) {
                const initialize = MapLabelInit;
                initialize();

                mapLabelsInitialized = true;
            }

            let mapLabel = new MapLabel({
                text: marker.getTitle(),
                position: new google.maps.LatLng(Number(latitude), Number(longitude)),
                map,
                fontSize: 15,
                fontColor: "#201000",
                align: "left"
            });

            gmLabels.push(mapLabel);
        }
    };
    
    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        let request = new XMLHttpRequest();

        request.open(REQUEST_GET, url, true);

        request.onload = function() {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                // Success!
                let data = (
                    skipJsonParse
                    ? request.response
                    : JSON.parse(request.response)
                );

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "function") {
                    failureCallback(request);
                }
            }
        };

        request.onerror = failureCallback;

        request.send();
    };

    bookChapterValid = function (bookId, chapter) {
        let book = books[bookId];

        if (book === undefined || chapter < 0 || chapter > book.numChapters) {
            return false;
        }

        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }

        return true;
    };

    booksGrid = function (volume) {
        return htmlDiv({
            classKey: CLASS_BOOKS,
            content: booksGridContent(volume)
        });
    };

    booksGridContent = function (volume) {
        let gridContent = "";

        volume.books.forEach(function (book) {
            gridContent += htmlLink({
                classKey: CLASS_BUTTON,
                id: book.id,
                href: `#${volume.id}:${book.id}`,
                content: book.gridName
            });
        });

        return gridContent;
    };

    cacheBooks = function (callback){
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function"){
            callback();
        }
    };

    chaptersGrid = function (book) {
        return htmlDiv({
            classKey: CLASS_VOLUME,
            content: htmlElement(TAG_HEADER5, book.fullName)
        }) + htmlDiv({
            classKey: CLASS_BOOKS,
            content: chaptersGridContent(book)
        });
    };

    
    chaptersGridContent = function (book) {
        let gridContent = "";
        let chapter = 1;

        while (chapter <= book.numChapters) {
            gridContent += htmlLink({
                classKey: `${CLASS_BUTTON} ${CLASS_CHAPTER}`,
                id: chapter,
                href: `#0:${book.id}:${chapter}`,
                content: chapter
            });

            chapter += 1;
        }

        return gridContent;
    };

    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null); //removes marker from map
        });

        gmMarkers = [];
    };

    encodedScripturesUrlParameters = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = "";

            if (verses !== undefined) {
                options += verses;
            }

            if (isJst !== undefined) {
                options += "&jst=JST";
            }

            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
        }
    };

    /*************new content ********* */
    getScripturesCallback = function (chapterHtml) {
        let book = books[requestedBookId];

        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;

        document.querySelectorAll(".navheading").forEach(function (element) {
            element.innerHTML += `<div class="nextprev">${requestedNextPrevious}</div>`;
        });

        insertBreadCrumbs(volumeForId(book.parentBookId), book, requestedChapter);
        setupMarkers();
    };

    getScripturesFailure = function (){
        document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter contents from server";
        insertBreadCrumbs();
    };

    htmlAnchor = function (volume) {
        return `<a name="v${volume.id}"></a>`;
    };
    
    
    htmlDiv = function (parameters) {
        let classString = "";
        let contentString = "";
        let idString = "";
    
        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }
        
        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }
        
        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }
        
        return `<div${idString}${classString}>${contentString}</div>`;
    };
    
    htmlElement = function (tagName, content, classValue) {
        let classString = "";

        if (classValue !== undefined) {
            classString = ` class="${classValue}"`;
        }

        return `<${tagName}${classString}>${content}</${tagName}>`;
    };
    
    
    
    htmlLink = function (parameters) {
        let classString = "";
        let contentString = "";
        let hrefString = "";
        let idString = "";
        let titleString = "";
    
        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }

        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }

        if (parameters.href !== undefined) {
            hrefString = ` href="${parameters.href}"`;
        }

        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        if (parameters.title !== undefined) {
            titleString = ` title="${parameters.title}"`;
        }
    
        return `<a${idString}${classString}${hrefString}${titleString}>${contentString}</a>`;    
    };

    /*************************************NEW **********************/

    htmlListItem = function (content) {
        return htmlElement(TAG_LIST_ITEM, content);
    };

    htmlListItemLink = function (content, href = "") {
        return htmlListItem(htmlLink({content, href: `#${href}`}));
    };

    //******************************************************** */

    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(URL_BOOKS, 
            data => {
                books = data;
                booksLoaded = true;

                if (volumesLoaded){
                    cacheBooks(callback);
                }
            }
        );
        ajax(URL_VOLUMES, 
            data => {
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded){
                    cacheBooks(callback);
                }
            }
        );
    };

    //**************************************NEW ************************ */
    insertBreadCrumbs = function (volume, book, chapter) {
        let crumbs = "";

        if (volume === undefined) {
            crumbs = htmlListItem(NAVIGATION_TEXT);
        } else {
            crumbs = htmlListItemLink(NAVIGATION_TEXT);

            if (book === undefined) {
                crumbs += htmlListItem(volume.fullName);
            } else {
                crumbs += htmlListItemLink(volume.fullName, volume.id);

                if (chapter === undefined || chapter <= 0) {
                    crumbs += htmlListItem(book.tocName);
                } else {
                    crumbs += htmlListItemLink(book.tocName, `${volume.id}:${book.id}`);
                    crumbs += htmlListItem(chapter);
                }
            }
        }

        document.getElementById(DIV_BREADCRUMBS).innerHTML = htmlElement(TAG_UNORDERED_LIST, crumbs);
    };

    markerIndex = function (latitude, longitude) {
        let i = gmMarkers.length - 1;

        while (i >= 0) {
            let marker = gmMarkers[i];

            const latitudeDelta = Math.abs(marker.getPosition().lat() - latitude);
            const longitudeDelta = Math.abs(marker.getPosition().lng() - longitude);

            if (latitudeDelta < 0.00000001 && longitudeDelta < 0.00000001) {
                return i;
            }

            i -= 1;
        }

        return -1;
    };

    mergePlacename = function (placename, index) {
        let marker = gmMarkers[index];
        let label = gmLabels[index];
        let title = marker.getTitle();

        if (!title.includes(placename)) {
            title += ", " + placename;
            marker.setTitle(title);
            label.text = title;
        }
    };

    //***************************************************************/

    navigateBook = function (bookId) {
        let book = books[bookId];

        if (book.numChapters <= 1) {
            navigateChapter(bookId, book.numChapters);
        } else {
            document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                id: DIV_SCRIPTURES_NAVIGATOR,
                content: chaptersGrid(book)
            })
            
        }
    };

    navigateChapter = function (bookId, chapter) {

        //******************************* NEW ********************************/
        requestedBookId = bookId;
        requestedChapter = chapter;

        let nextPrev = previousChapter(bookId, chapter);

        if (nextPrev === undefined) {
            requestedNextPrevious = "";
        } else {
            requestedNextPrevious = nextPreviousMarkup(nextPrev, ICON_PREVIOUS);
        }

        nextPrev = nextChapter(bookId, chapter);

        if (nextPrev !== undefined) {
            requestedNextPrevious += nextPreviousMarkup(nextPrev, ICON_NEXT);
        }

        //***************************************************************/
        ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
    };

    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });
    };

    nextChapter = function(bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter < book.numChapters) {
                return [
                    bookId,
                    chapter + 1,
                    titleForBookChapter(book, chapter + 1)
                ];
            }
    
            let nextBook = books[bookId + 1];
    
            if (nextBook !== undefined) {
                let nextChapterValue = 0;
    
                if (nextBook.numChapters > 0) {
                    nextChapterValue = 1;
                }
    
                return [
                    nextBook.id,
                    nextChapterValue,
                    titleForBookChapter(nextBook, nextChapterValue)
                ];
            }
        }
    };

    //***************************** NEW **********************************/
    nextPreviousMarkup = function (nextPrev, icon) {
        return htmlLink({
            content: htmlElement(TAG_SPAN, icon, CLASS_ICON),
            href: `#0:${nextPrev[0]}:${nextPrev[1]}`,
            title: nextPrev[2]
        });
    };

    //***************************************************************/

    onHashChanged = function () {
        let ids = [];

        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1) {
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
                navigateHome();
            } else {
                navigateHome(volumeId);
            }
        } else {
            let bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                if (ids.length === 2) {
                    navigateBook(bookId);
                } else {
                    let chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };




    //*******************************NEW - DELETE unique geoplaces if keeping? ********************************/

    nextPreviousMarkup = function (nextPrev, icon) {
        return htmlLink({
            content: htmlElement(TAG_SPAN, icon, CLASS_ICON),
            href: `#0:${nextPrev[0]}:${nextPrev[1]}`,
            title: nextPrev[2]
        });
    };

    previousChapter = function (bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter > 1) {
                return [
                    bookId,
                    chapter - 1,
                    titleForBookChapter(book, chapter - 1)
                ];
            }

            let previousBook = books[bookId - 1];

            if (previousBook !== undefined) {
                return [
                    previousBook.id,
                    previousBook.numChapters,
                    titleForBookChapter(previousBook, previousBook.numChapters)
                ];
            }
        }
    };

    //***************************************************************/

    setupMarkers = function () {
        if (gmMarkers.length > 0) {
            clearMarkers();
        }

        let matches;

        document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(function (element) {
            matches = LAT_LON_PARSER.exec(element.getAttribute("onclick"));

            if (matches) {
                let placename = matches[INDEX_PLACENAME];
                let latitude = parseFloat(matches[INDEX_LATITUDE]);
                let longitude = parseFloat(matches[INDEX_LONGITUDE]);
                let flag = matches[INDEX_FLAG];

                if (flag !== "") {
                    placename = `${placename} ${flag}`;
                }

                addMarker(placename, latitude, longitude);
            }
        });

        setZoom();
    };

    setZoom = function () {
        let bounds = new google.maps.LatLngBounds()

        // in case there is only one marker, need to not zoom in so much
        if (gmMarkers.length === 1) {
            bounds.extend(gmMarkers[0].getPosition())
            map.fitBounds(bounds)
            map.setZoom(ZOOM_LEVEL)
        }
        else {
            gmMarkers.map(location => {
                bounds.extend(location.getPosition())
                map.fitBounds(bounds)
            })
        }
    }

    showLocation = function (geotagId, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
        console.log(geotagId, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading);
       
        let bounds = new google.maps.LatLngBounds();

        bounds.extend({lat: Number(latitude), lng: Number(longitude)});
        map.fitBounds(bounds);
        map.setZoom(ZOOM_LEVEL);
    };

    titleForBookChapter = function (book, chapter) {

        if (book !== undefined) {
            if (chapter > 0) {
                return `${book.tocName} ${chapter}`;
            }
        }

        return book.tocName;
    };

    //****************************** NEW *********************************/

    volumeForId = function (volumeId) {
        if (volumeId !== undefined && volumeId > 0 && volumeId < volumes.length) {
            return volumes[volumeId - 1];
        }
    };

    //****************************** *** *********************************/

    volumesGridContent = function (volumeId) {
        let gridContent = "";

        volumes.forEach(function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                gridContent += htmlDiv({
                    classKey: CLASS_VOLUME,
                    content: htmlAnchor(volume) + htmlElement(TAG_HEADER5, volume.fullName)
                });

                gridContent += booksGrid(volume);
            }
        });
        return gridContent + BOTTOM_PADDING;
    };

    //---------------------------------PUBLIC API---------------------------------


    return {
        init,
        onHashChanged,
        showLocation
    };
}());