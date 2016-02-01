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


onShiftMetaClick : Signal.Address a -> a -> a -> a -> Attribute
onShiftMetaClick addr withNone withShift withMeta =
  on "click" modifierKeys
    ( \mods ->
        let
          msg =
            if mods.metaKey
              then withMeta
              else if mods.shiftKey
                then withShift
                else withNone
        in
          Signal.message addr msg
    )
