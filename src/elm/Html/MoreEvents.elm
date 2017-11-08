module Html.MoreEvents exposing (..)

import Html exposing (Attribute)
import Html.Events exposing (defaultOptions, on)
import Json.Decode as Json exposing (Decoder, bool, field, map, map4)
import Types exposing (..)


type alias ModifierKeys =
    { shiftKey : Bool
    , ctrlKey : Bool
    , altKey : Bool
    , metaKey : Bool
    }


modifierDecoder : Decoder ModifierKeys
modifierDecoder =
    map4 ModifierKeys
        (field "altKey" bool)
        (field "ctrlKey" bool)
        (field "shiftKey" bool)
        (field "metaKey" bool)


convertToMsg : msg -> msg -> msg -> msg -> msg -> ModifierKeys -> msg
convertToMsg plainMsg shiftMsg ctrlMsg altMsg metaMsg modifierKeys =
    let
        finalMsg =
            if modifierKeys.shiftKey then
                shiftMsg
            else if modifierKeys.ctrlKey then
                ctrlMsg
            else if modifierKeys.altKey then
                altMsg
            else if modifierKeys.metaKey then
                metaMsg
            else
                plainMsg
    in
    finalMsg


onClickWithModifiers : msg -> msg -> msg -> msg -> msg -> Attribute msg
onClickWithModifiers plainMsg shiftMsg ctrlMsg altMsg metaMsg =
    on "click" (map (convertToMsg plainMsg shiftMsg ctrlMsg altMsg metaMsg) modifierDecoder)
