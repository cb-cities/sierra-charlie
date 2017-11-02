module Html.MoreEvents exposing (..)

import Html exposing (Attribute)
import Html.Events exposing (defaultOptions, on)
import Json.Decode as Json exposing (map, field, bool)


-- type alias ModifierKeys =
--     { shiftKey : Bool
--     , ctrlKey : Bool
--     , altKey : Bool
--     , metaKey : Bool
--     }

-- compiler complains that i'm returning a `msg` instead of a `Json.Decoder msg`
modifierKeys : msg -> msg -> msg -> msg -> msg -> Json.Decoder msg
modifierKeys plainMsg shiftMsg ctrlMsg altMsg metaMsg =
    if (field "metaKey" bool) then
        map metaMsg metaMsg
    else if (field "altKey" bool) then
        altMsg
    else if (field "mods.ctrlKey" bool) then
        ctrlMsg
    else if (field "mods.shiftKey" bool) then
        shiftMsg
    else
        plainMsg 


onClickWithModifiers : msg -> msg -> msg -> msg -> msg -> Attribute msg
onClickWithModifiers plainMsg shiftMsg ctrlMsg altMsg metaMsg =
    on "click" (modifierKeys plainMsg shiftMsg ctrlMsg altMsg metaMsg)
