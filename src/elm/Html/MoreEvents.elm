module Html.MoreEvents exposing (..)

import Html exposing (Attribute)
import Html.Events exposing (defaultOptions, on, onWithOptions)
import Json.Decode as Json exposing (map4, field)


type alias ModifierKeys =
    { shiftKey : Bool
    , ctrlKey : Bool
    , altKey : Bool
    , metaKey : Bool
    }


modifierKeys : Json.Decoder ModifierKeys
modifierKeys =
    map4 ModifierKeys
        (field "shiftKey" Json.bool)
        (field "ctrlKey" Json.bool)
        (field "altKey" Json.bool)
        (field "metaKey" Json.bool)


onClickWithModifiers : a -> a -> a -> a -> a -> Attribute Msg
onClickWithModifiers plainMsg shiftMsg ctrlMsg altMsg metaMsg =
    on "click"
        modifierKeys
        (\mods ->
            let
                msg =
                    if mods.metaKey then
                        metaMsg
                    else if mods.altKey then
                        altMsg
                    else if mods.ctrlKey then
                        ctrlMsg
                    else if mods.shiftKey then
                        shiftMsg
                    else
                        plainMsg
            in
                Signal.message msg
        )
