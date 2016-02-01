module Html.MoreEvents where

import Html exposing (Attribute)
import Html.Events exposing (on)
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


onClickWithModifiers : Signal.Address a -> a -> a -> a -> a -> a -> Attribute
onClickWithModifiers addr action shiftAction ctrlAction altAction metaAction =
  on "click" modifierKeys
    ( \mods ->
        let
          msg =
            if mods.metaKey then metaAction
            else if mods.altKey then altAction
            else if mods.ctrlKey then ctrlAction
            else if mods.shiftKey then shiftAction
            else action
        in
          Signal.message addr msg
    )
