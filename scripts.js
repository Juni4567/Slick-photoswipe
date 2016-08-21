$(document).ready(function(){
    var initPhotoSwipeFromDOM = function(gallerySelector) {

    // parse slide data (url, title, size ...) from DOM elements 
    // (children of gallerySelector)
 
    var parseThumbnailElements = function(el) {
        
        /*  Extension to photoswipe. 
            First fetch the element clicked on. 
            It is used to set the index later */
        var entryElement = el.querySelectorAll('figure');
        var element = entryElement[0].querySelectorAll('a');
        var firstImage = element[0].getAttribute('href');

        /*  Extension to photoswipe. 
            Now overwrite variable "el" and populate it with DOM data
            from the DIV containing the thumbnails                      */
        var allElm = document.querySelectorAll(gallerySelector);
        var el = allElm[0].querySelectorAll('figure');

        var thumbElements = el,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for(var i = 0; i < numNodes; i++) {

            figureEl = thumbElements[i]; // <figure> element


            // include only element nodes 
            if(figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0]; // <a> element

            size = linkEl.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: linkEl.getAttribute('href'),
                w:      parseInt(size[0], 10),
                h:      parseInt(size[1], 10),
                /*  Extension to photoswipe. 
                    Extend object ITEM with "start". Set to true when it is the 
                    thumbnail clicked in the browser.
                    Search the source for item.start to see how it is used  */
                start:  linkEl.getAttribute('href') === firstImage ? true : false
            };

            if(figureEl.children.length > 1) {
                // <figcaption> content
                item.title = figureEl.children[1].innerHTML; 
            }

            if(linkEl.children.length > 0) {
                // <img> thumbnail element, retrieving thumbnail url
                item.msrc = linkEl.children[0].getAttribute('src');
            } 

            item.el = figureEl; // save link to element for getThumbBoundsFn
            items.push(item);
        }

        return items;
    };
// End parseThumbnailElements.    

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if(!clickedListItem) {
            return;
        }

        // find index of clicked item by looping through all child nodes
        // alternatively, you may define index via data- attribute
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if(childNodes[i].nodeType !== 1) { 
                continue; 
            }

            if(childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }



        if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery );
        }
        return false;
    };

    // parse picture index and gallery index from URL (#&pid=1&gid=2)
    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1),
        params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');  
            if(pair.length < 2) {
                continue;
            }           
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of documentation for more info
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect(); 

                return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};

            }

        };

        // PhotoSwipe opened from URL
        if(fromURL) {
            if(options.galleryPIDs) {
                // parse real index when custom PIDs are used 
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for(var j = 0; j < items.length; j++) {
                    if(items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                // in URL indexes start from 1
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }
        
        /*  Extension to photoswipe. 
            Set index with item.start */
        for (var findInd = 0; findInd < items.length; findInd++) {
            if (items[findInd].start) {
                options.index = findInd;
                break;
            }   
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }

};

// execute above function
initPhotoSwipeFromDOM('#SlickPhotoswipGallery');
$("#SlickPhotoswipGallery").slick({
                    // dots: bigBenOptions.gallery.dots,
                    // arrows: bigBenOptions.gallery.arrows,
                    // rows: bigBenOptions.gallery.rows,
                    // speed: bigBenOptions.gallery.speed,
                    // infinite: bigBenOptions.gallery.infinite,
                    // centerMode: bigBenOptions.gallery.centerMode,
                    // slidesToShow: bigBenOptions.gallery.slidesToShow,
                    // slidesToScroll: bigBenOptions.gallery.slidesToScroll,
                    // prevArrow: bigBenOptions.gallery.prevArrow,
                    // nextArrow: bigBenOptions.gallery.nextArrow,
                    // responsive: bigBenOptions.gallery.responsive,
                    // customPaging: bigBenOptions.gallery.customPaging,

                    dots: true,
                    // shows/hides left/right arrow
                    arrows: true,
                    // if set will show custom carousel paging e.g. by default it shows number instead of dots
                    // customPaging : function(slider, i) {
                    // return '<a>'+(i+1)+'</a>';
                    // },
                    // Number of rows to show in the carousel
                    rows: 2,
                    // defines the speed of carousel slide
                    speed: 300,
                    // if set the carousel will always be slid to first slide if no slide left
                    infinite: false,
                    // active slide will be centered if true
                    centerMode: false,
                    // How many slides per row
                    slidesToShow: 3,
                    // How many slides to scroll on slide left or right mostly equals to slidesToShow 
                    slidesToScroll: 3,
                    prevArrow: '<div class="slick-prev"><i class="i-chev-left-thin"></i><span class="sr-text">Previous</span></div>',
                    nextArrow: '<div class="slick-next"><i class="i-chev-right-thin"></i><span class="sr-text">Next</span></div>',
                    responsive: [
                        {
                          breakpoint: 1024,
                          settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3,
                            infinite: true,
                            // dots: true
                          }
                        },
                        {
                          breakpoint: 600,
                          settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2
                          }
                        },
                        {
                          breakpoint: 480,
                          settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                          }
                        }
                        // You can unslick at a given breakpoint now by adding:
                        // settings: "unslick"
                        // instead of a settings object
                      ]
                });
});