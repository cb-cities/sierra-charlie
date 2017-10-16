module Html.MoreEvents exposing (..)

import Html exposing (Attribute)
import Html.Events exposing (defaultOptions, on, onWithOptions)
import Json.Decode as Json exposing ((:=))


type alias ModifierKeys =
  { shiftKey : Bool
  , ctrlKey : Bool
  , altKey : Bool
  , metaKey : Bool
  }


modifierKeys : Json.Decoder ModifierKeys
modifierKeys =
  Json.object4 ModifierKeys
    ("shiftKey" := Json.bool)
    ("ctrlKey" := Json.bool)
    ("altKey" := Json.bool)
    ("metaKey" := Json.bool)


onClickWithModifiers : a -> a -> a -> a -> a -> Attribute Msg
onClickWithModifiers plainMsg shiftMsg ctrlMsg altMsg metaMsg =
  on "click" modifierKeys
    ( \mods ->
        let
          msg =
            if mods.metaKey then metaMsg
            else if mods.altKey then altMsg
            else if mods.ctrlKey then ctrlMsg
            else if mods.shiftKey then shiftMsg
            else plainMsg
        in
          Signal.message msg
    )
