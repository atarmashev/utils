This package contains set of command line utils that could be useful for Frontend development among them on TypeScript.

### Installation

Global installation is prefered:

    npm i -g @atarmashev/util
    

### Command line interface

    ajz

Executes command line interface that allowes to choose required command.

--------

    ajz gv

Executes generator of validators for TypeScript interfaces. I hope you like Russian.

--------

    ajz vw

Executes program that changes style files (.css, .scss, .sass, .less). All values in 'px' are converted 
to 'vw' using width of the layout. The idea is to automatically convert pure fixed layout to pure rubber layout. 
After execution your files will be changed. Use this functionality at your own risk. To decrease risks usage of any
version management system is strongly recommended.

--------
