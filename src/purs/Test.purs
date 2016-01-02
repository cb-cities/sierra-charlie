module Test (nativeObject, foreignObject) where

nativeObject :: String
nativeObject = "I am Jack’s native object."

foreign import foreignObject :: String
