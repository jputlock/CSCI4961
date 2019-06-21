# Lab 05

## Step 1:

### tutorial.cxx
```
// A simple program that computes the square root of a number
#include <cmath>
#include <cstdlib>
#include <iostream>
#include <string>

#include "TutorialConfig.h"

int main(int argc, char* argv[])
{
  if (argc < 2) {
    std::cout << "Usage: " << argv[0] << " number" << std::endl;
    return 1;
  }

  std::cout << "This is version number " << Tutorial_VERSION_MAJOR << "." << Tutorial_VERSION_MINOR << std::endl;

  double inputValue = std::stod(argv[1]);

  double outputValue = sqrt(inputValue);
  std::cout << "The square root of " << inputValue << " is " << outputValue
            << std::endl;
  return 0;
}

```
### CMakeLists.txt
```
cmake_minimum_required(VERSION 3.14)

project(Tutorial)

set(Tutorial_VERSION_MAJOR 1)
set(Tutorial_VERSION_MINOR 0)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

 # configure a header file to pass some of the CMake settings                  
  # to the source code                                                          
  configure_file(                                                               
    "${PROJECT_SOURCE_DIR}/TutorialConfig.h.in"                                 
    "${PROJECT_BINARY_DIR}/TutorialConfig.h"                                    
    )                                                                           

  # add the executable                                                          
  add_executable(Tutorial tutorial.cxx)                                         

  # add the binary tree to the search path for include files                    
  # so that we will find TutorialConfig.h                                       
  target_include_directories(Tutorial PUBLIC                                    
                             "${PROJECT_BINARY_DIR}"                            
                             )
```

!(step1)[images/step1.png]

## Step 2

### tutorial.cxx
```
// A simple program that computes the square root of a number
#include <cmath>
#include <iostream>
#include <string>

#include "TutorialConfig.h"

#ifdef USE_MYMATH
    #include "MathFunctions.h"
#endif

int main(int argc, char* argv[]){
    if (argc < 2) {
        std::cout << argv[0] << " Version " << Tutorial_VERSION_MAJOR << "."
                             << Tutorial_VERSION_MINOR << std::endl;
        std::cout << "Usage: " << argv[0] << " number" << std::endl;
        return 1;
    }

    double inputValue = std::stod(argv[1]);

    double outputValue = 0;

    #ifdef USE_MYMATH
        outputValue = mysqrt(inputValue);
    #else
        outputValue = sqrt(inputValue);
    #endif
    std::cout << "The square root of " << inputValue << " is " << outputValue
            << std::endl;
    return 0;
}
```

### CMakeLists.txt
```
 cmake_minimum_required(VERSION 3.3)                                           
project(Tutorial)                                                             

set(CMAKE_CXX_STANDARD 14)                                                    

# the version number.                                                         
set(Tutorial_VERSION_MAJOR 1)                                                 
set(Tutorial_VERSION_MINOR 0)                                                 

# configure a header file to pass some of the CMake settings                  
# to the source code                                                          
configure_file(                                                               
	"${PROJECT_SOURCE_DIR}/TutorialConfig.h.in"                                 
	"${PROJECT_BINARY_DIR}/TutorialConfig.h"                                    
)                                                                           

# should we use our own math functions                                        
option(USE_MYMATH "Use tutorial provided math implementation" ON)             

# add the MathFunctions library?                                              
if(USE_MYMATH)                                                                
	add_subdirectory(MathFunctions)                                             
	list(APPEND EXTRA_LIBS MathFunctions)                                       
	list(APPEND EXTRA_INCLUDES "${PROJECT_SOURCE_DIR}/MathFunctions")           
endif(USE_MYMATH)                                                             

# add the executable                                                          
add_executable(Tutorial tutorial.cxx)                                         

target_link_libraries(Tutorial ${EXTRA_LIBS})                                 

# add the binary tree to the search path for include files                    
# so that we will find TutorialConfig.h                                       
target_include_directories(Tutorial PUBLIC                                    
                           "${PROJECT_BINARY_DIR}"                            
                            ${EXTRA_INCLUDES}                                  
                          )            
```

!(step2)[images/step2.png]

## Step 3

### CMakeLists.txt
```
cmake_minimum_required(VERSION 3.3)
project(Tutorial)

set(CMAKE_CXX_STANDARD 14)

# should we use our own math functions
option(USE_MYMATH "Use tutorial provided math implementation" ON)

# the version number.
set(Tutorial_VERSION_MAJOR 1)
set(Tutorial_VERSION_MINOR 0)

# configure a header file to pass some of the CMake settings
# to the source code
configure_file(
  "${PROJECT_SOURCE_DIR}/TutorialConfig.h.in"
  "${PROJECT_BINARY_DIR}/TutorialConfig.h"
  )

# add the MathFunctions library?
if(USE_MYMATH)
	add_subdirectory(MathFunctions)
	list(APPEND EXTRA_LIBS MathFunctions)
endif(USE_MYMATH)

# add the executable
add_executable(Tutorial tutorial.cxx)

target_link_libraries(Tutorial ${EXTRA_LIBS})


target_include_directories(Tutorial PUBLIC
                           "${PROJECT_BINARY_DIR}"
                           )
```

### MathFunctions/CMakeLists.txt
```
add_library(MathFunctions mysqrt.cxx)
target_include_directories(MathFunctions INTERFACE ${CMAKE_CURRENT_SOURCE_DIR})
```

!(step3)[images/step3.png]

## Step 4

### CMakeLists.txt
```
cmake_minimum_required(VERSION 3.3)
project(Tutorial)

set(CMAKE_CXX_STANDARD 14)

# should we use our own math functions
option(USE_MYMATH "Use tutorial provided math implementation" ON)

# the version number.
set(Tutorial_VERSION_MAJOR 1)
set(Tutorial_VERSION_MINOR 0)

# configure a header file to pass some of the CMake settings
# to the source code
configure_file(
  "${PROJECT_SOURCE_DIR}/TutorialConfig.h.in"
  "${PROJECT_BINARY_DIR}/TutorialConfig.h"
  )

# add the MathFunctions library?
if(USE_MYMATH)
  add_subdirectory(MathFunctions)
  list(APPEND EXTRA_LIBS MathFunctions)
endif(USE_MYMATH)

# add the executable
add_executable(Tutorial tutorial.cxx)

install (TARGETS Tutorial DESTINATION bin)
install (FILES "${PROJECT_BINARY_DIR}/TutorialConfig.h" DESTINATION include)

target_link_libraries(Tutorial PUBLIC ${EXTRA_LIBS})

# add the binary tree to the search path for include files
# so that we will find TutorialConfig.h
target_include_directories(Tutorial PUBLIC
                           "${PROJECT_BINARY_DIR}"
                           )
enable_testing()

# format: NAME <name of test> COMMAND <name of command> <args>

# testing if it runs
add_test(NAME Runs COMMAND Tutorial 25)

# testing if it provides usage message
add_test(NAME Usage COMMAND Tutorial)
set_tests_properties(Usage PROPERTIES PASS_REGULAR_EXPRESSION "Usage:.*number")

# define a function to simplify adding more tests
function (do_test target arg result)
	add_test(NAME Comp${arg} COMMAND ${target} ${arg})
	set_tests_properties(Comp${arg}
		PROPERTIES PASS_REGULAR_EXPRESSION ${result})
endfunction(do_test)

do_test(Tutorial 25 "25 is 5")
do_test(Tutorial -25 "-25 is [-nan|nan|0]")
do_test(Tutorial 0.0001 "0.0001 is 0.01")
```

### MathFunctions/CMakeLists.txt
```
add_library(MathFunctions mysqrt.cxx)

install (TARGETS MathFunctions DESTINATION bin)
install (FILES MathFunctions.h DESTINATION include)

# state that anybody linking to us needs to include the current source dir
# to find MathFunctions.h, while we don't.
target_include_directories(MathFunctions
          INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}
          )
```

!(step4)[images/step4.png]

## Step 5

### CMakeLists.txt
```
cmake_minimum_required(VERSION 3.3)
project(Tutorial)

set(CMAKE_CXX_STANDARD 14)

# should we use our own math functions
option(USE_MYMATH "Use tutorial provided math implementation" ON)

# the version number.
set(Tutorial_VERSION_MAJOR 1)
set(Tutorial_VERSION_MINOR 0)

# configure a header file to pass some of the CMake settings
# to the source code
configure_file(
  "${PROJECT_SOURCE_DIR}/TutorialConfig.h.in"
  "${PROJECT_BINARY_DIR}/TutorialConfig.h"
  )

# does this system provide log and exp?
include(CheckSymbolExists)
set(CMAKE_REQUIRED_LIBRARIES "m")
check_symbol_exists(log "math.h" HAVE_LOG)
check_symbol_exists(exp "math.h" HAVE_EXP)

# add the MathFunctions library?
if(USE_MYMATH)
  add_subdirectory(MathFunctions)
  list(APPEND EXTRA_LIBS MathFunctions)
endif()

# add the executable
add_executable(Tutorial tutorial.cxx)
target_link_libraries(Tutorial PUBLIC ${EXTRA_LIBS})

# add the binary tree to the search path for include files
# so that we will find TutorialConfig.h
target_include_directories(Tutorial PUBLIC
                           "${PROJECT_BINARY_DIR}"
                           )

# add the install targets
install(TARGETS Tutorial DESTINATION bin)
install(FILES "${PROJECT_BINARY_DIR}/TutorialConfig.h"
  DESTINATION include
  )

# enable testing
enable_testing()

# does the application run
add_test(NAME Runs COMMAND Tutorial 25)

# does the usage message work?
add_test(NAME Usage COMMAND Tutorial)
set_tests_properties(Usage
  PROPERTIES PASS_REGULAR_EXPRESSION "Usage:.*number"
  )

# define a function to simplify adding tests
function(do_test target arg result)
  add_test(NAME Comp${arg} COMMAND ${target} ${arg})
  set_tests_properties(Comp${arg}
    PROPERTIES PASS_REGULAR_EXPRESSION ${result}
    )
endfunction(do_test)

# do a bunch of result based tests
do_test(Tutorial 4 "4 is 2")
do_test(Tutorial 9 "9 is 3")
do_test(Tutorial 5 "5 is 2.236")
do_test(Tutorial 7 "7 is 2.645")
do_test(Tutorial 25 "25 is 5")
do_test(Tutorial -25 "-25 is [-nan|nan|0]")
do_test(Tutorial 0.0001 "0.0001 is 0.01")
```

### MathFunctions/CMakeLists.txt
```
add_library(MathFunctions mysqrt.cxx)

# state that anybody linking to us needs to include the current source dir
# to find MathFunctions.h, while we don't.
target_include_directories(MathFunctions
          INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}
	  PRIVATE ${Tutorial_BINARY_DIR}
          )

install(TARGETS MathFunctions DESTINATION lib)
install(FILES MathFunctions.h DESTINATION include)
```

!(step5)[images/step5.png]

# Part 2

## Makefile
```
all: static

shared: program.o libblock.so
	cc program.o libblock.so -o shared -Wl,-rpath='.'

static: program.o libprint.a
	cc program.o libprint.a -o static

program.o:
	cc -fPIC -c program.c -o program.o

# Creating a Static Library

libprint.a: block.o
	ar qc libprint.a source/block.o

# Creating a Shared Library

libblock.so: block.o
	cc -shared -o libblock.so source/block.o

# both libraries depend on this

block.o:
	cc -fPIC -c source/block.c -o source/block.o

clean:
	rm -f *.o Makefile.bak
```
## CMakeLists.txt
```
cmake_minimum_required(VERSION 3.14)

project(Dynamic)

add_library(StaticSource STATIC source/block.c)

add_library(SharedSource SHARED source/block.c)

# add the executable                                                          
add_executable(Shared program.c)
target_link_libraries(Shared SharedSource)

add_executable(Static program.c)
target_link_libraries(Static StaticSource)
```

## Size analysis

Both the Static and Shared versions of the program are approximately the same size, but static is a little bit bigger (Static 16712 vs Shared 16536).

## Results

![picture](images/staticvsshared.png)
