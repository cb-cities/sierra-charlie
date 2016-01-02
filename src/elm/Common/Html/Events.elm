module Common.Html.Events where

import Html exposing (Attribute)
import Html.Events exposing (onWithOptions)
import Json.Decode exposing (value)
import Signal exposing (Address, message)


on : String -> Address a -> a -> Attribute
on event address action =
    let
      options =
        { preventDefault = False
        , stopPropagation = True
        }
    in
      onWithOptions event options value (\_ -> message address action)


onClick : Address a -> a -> Attribute
onClick =
    on "click"
