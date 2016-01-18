module Export where

import Task exposing (Task)

import Native.Export


viaBlobURL : a -> Task x ()
viaBlobURL = Native.Export.viaBlobURL
