# must-should-may-i
 
This scans a specification and pulls out all the "MUST", "REQUIRED", "SHALL", "SHOULD", "RECOMMENDED",  "MAY", "OPTIONAL" terms (and also the "* NOT" terms).

## caveat
This works pretty well for EPUB and Audiobook specs. Generally, if the document is a single page and uses the `section` element, it should do well.

If the spec does not use the `section` element, then the links aren't really specific to the subsection, mostly because I don't really have time to make this a universal spec analyzer. PRs though are welcome :) 