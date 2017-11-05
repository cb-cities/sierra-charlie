module UI exposing (..)

-- import Signal exposing (Address, Mailbox)
-- import StartApp exposing (App)

import Html exposing (Html)
import Platform.Cmd as Cmd exposing (Cmd, none)
import Render exposing (renderUI)
import Special
import Task exposing (Task, andThen)
import Types exposing (..)


defaultState : State
defaultState =
    { mode = Nothing
    , loadingProgress = 0
    , highlightedFeature = Nothing
    , selectedFeature = Nothing
    , routes = []
    , adjustment = Nothing
    , viewGroups = []
    , activeViews = []
    , viewInfoVisible = False
    , modelGroups = []
    , activeModel = Nothing
    , modelInfoVisible = False
    }


update : Msg -> State -> ( State, Cmd Msg )
update action state =
    case action of
        Idle ->
            ( state, none )

        Receive (UpdateMode mode) ->
            ( { state | mode = mode }, none )

        Receive (UpdateLoadingProgress loadingProgress) ->
            ( { state | loadingProgress = loadingProgress }, none )

        Receive (UpdateHighlightedFeature feature) ->
            ( { state | highlightedFeature = feature }, none )

        Receive (UpdateSelectedFeature feature) ->
            ( { state | selectedFeature = feature }, none )

        Receive (UpdateRoutes routes) ->
            ( { state | routes = routes }, none )

        Receive (UpdateAdjustment adjustment) ->
            ( { state | adjustment = adjustment }, none )

        Receive (UpdateViewGroups viewGroups) ->
            ( { state | viewGroups = viewGroups }, none )

        Receive (UpdateActiveViews activeViews) ->
            ( { state | activeViews = activeViews }, none )

        Receive (UpdateModelGroups modelGroups) ->
            ( { state | modelGroups = modelGroups }, none )

        Receive (UpdateActiveModel activeModel) ->
            ( { state | activeModel = activeModel }, none )

        Send message ->
            ( state, send message )

        SendSpecial tag ->
            ( state, sendSpecial tag )

        ToggleViewInfo ->
            ( { state | viewInfoVisible = not state.viewInfoVisible }, none )

        ToggleModelInfo ->
            ( { state | modelInfoVisible = not state.modelInfoVisible }, none )


decodeMode : Maybe String -> Maybe Mode
decodeMode maybeEncoded =
    case maybeEncoded of
        Nothing ->
            Nothing

        Just encoded ->
            case encoded of
                "GetRoute" ->
                    Just GetRoute

                "GetRouteFromGoogle" ->
                    Just GetRouteFromGoogle

                _ ->
                    Debug.crash ("Invalid mode: " ++ toString encoded)


decodeIncomingMessage : Maybe EncodedIncomingMessage -> Msg
decodeIncomingMessage maybeEncoded =
    case maybeEncoded of
        Nothing ->
            Idle

        Just encoded ->
            case encoded.tag of
                "UpdateMode" ->
                    Receive (UpdateMode (decodeMode encoded.mode))

                "UpdateLoadingProgress" ->
                    Receive (UpdateLoadingProgress encoded.loadingProgress)

                "UpdateHighlightedFeature" ->
                    Receive (UpdateHighlightedFeature encoded.feature)

                "UpdateSelectedFeature" ->
                    Receive (UpdateSelectedFeature encoded.feature)

                "UpdateRoutes" ->
                    Receive (UpdateRoutes encoded.routes)

                "UpdateAdjustment" ->
                    Receive (UpdateAdjustment encoded.adjustment)

                "UpdateViewGroups" ->
                    Receive (UpdateViewGroups encoded.viewGroups)

                "UpdateActiveViews" ->
                    Receive (UpdateActiveViews encoded.activeViews)

                "UpdateModelGroups" ->
                    Receive (UpdateModelGroups encoded.modelGroups)

                "UpdateActiveModel" ->
                    Receive (UpdateActiveModel encoded.activeModel)

                _ ->
                    Debug.crash ("Invalid incoming message: " ++ toString encoded)



-- -- Elm 0.16
-- port incomingMessage : Signal (Maybe EncodedIncomingMessage)
-- incomingAction : Signal Action
-- incomingAction =
--   Signal.map decodeIncomingMessage incomingMessage
-- Elm 0.18


incomingAction : Sub Msg
incomingAction =
    incomingMessage decodeIncomingMessage


handleSubs : Model -> Sub Action
handleSubs model =
    incomingAction


encodeMode : Maybe Mode -> Maybe String
encodeMode maybeMode =
    case maybeMode of
        Nothing ->
            Nothing

        Just mode ->
            case mode of
                GetRoute ->
                    Just "GetRoute"

                GetRouteFromGoogle ->
                    Just "GetRouteFromGoogle"


encodeMessage : String -> EncodedOutgoingMessage
encodeMessage tag =
    { tag = tag
    , strings = []
    }


encodeStringsMessage : String -> List String -> EncodedOutgoingMessage
encodeStringsMessage tag strings =
    let
        base =
            encodeMessage tag
    in
    { base | strings = strings }


encodeStringMessage : String -> Maybe String -> EncodedOutgoingMessage
encodeStringMessage tag maybeString =
    case maybeString of
        Nothing ->
            encodeStringsMessage tag []

        Just string ->
            encodeStringsMessage tag [ string ]


encodeModeMessage : String -> Maybe Mode -> EncodedOutgoingMessage
encodeModeMessage tag mode =
    encodeStringMessage tag (encodeMode mode)


encodeOutgoingMessage : OutgoingMessage -> EncodedOutgoingMessage
encodeOutgoingMessage message =
    case message of
        SetMode mode ->
            encodeModeMessage "SetMode" mode

        HighlightFeatureByTOID toid ->
            encodeStringMessage "HighlightFeatureByTOID" toid

        SelectFeatureByTOID toid ->
            encodeStringMessage "SelectFeatureByTOID" toid

        DeleteSelectedFeature ->
            encodeMessage "DeleteSelectedFeature"

        UndeleteSelectedFeature ->
            encodeMessage "UndeleteSelectedFeature"

        ClearRoutes ->
            encodeMessage "ClearRoutes"

        ClearAdjustment ->
            encodeMessage "ClearAdjustment"

        ChooseViews names ->
            encodeStringsMessage "ChooseViews" names

        ChooseModel name ->
            encodeStringMessage "ChooseModel" (Just name)



-- #### Gambling on the port call later in this script making this Elm 0.16 section unnecessary ####
-- outgoingMessageMailbox : Mailbox (Maybe EncodedOutgoingMessage)
-- outgoingMessageMailbox =
--     Signal.mailbox Nothing
-- send : OutgoingMessage -> Cmd Msg
-- send message =
--     let
--         maybeEncoded =
--             Just (encodeOutgoingMessage message)
--     in
--         Cmd.task
--             (Signal.send outgoingMessageMailbox.address maybeEncoded
--                 |> andThen (\_ -> Task.succeed Idle)
--             )


encodeSpecialOutgoingMessage : SpecialOutgoingMessage -> String
encodeSpecialOutgoingMessage message =
    case message of
        SaveRoutesAsJSON ->
            "SaveRoutesAsJSON"

        SaveAdjustmentAsJSON ->
            "SaveAdjustmentAsJSON"


sendSpecial : SpecialOutgoingMessage -> Cmd Msg
sendSpecial message =
    let
        encoded =
            encodeSpecialOutgoingMessage message
    in
    Cmd.task
        (Special.send encoded
            |> andThen (\_ -> Task.succeed Idle)
        )


init : ( State, Cmd Msg )
init =
    ( defaultState, Cmd.task (Task.succeed Idle) )



-- -- Elm 0.16
-- ui : App State
-- ui =
--     StartApp.start
--         { init = init
--         , update = update
--         , view = renderUI
--         , inputs = [ incomingAction ]
--         }
--
--
-- port tasks : Task Never () -> Cmd msg
--
--
-- main : Signal Html
-- main =
--     ui.html
-- Elm 0.18


main : Program Never
main =
    Html.program
        { init = init
        , update = update
        , view = renderUI
        , subscriptions = incomingAction
        }
