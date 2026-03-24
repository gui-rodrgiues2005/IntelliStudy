using System.Collections.Concurrent;

public class GenerationManager
{
    private readonly Dictionary<string, GenerationState> _states = new();

    public void Start(string requestId)
    {
        _states[requestId] = new GenerationState();
    }

    public GenerationState GetState(string requestId)
    {
        return _states[requestId];
    }

    public void Pause(string requestId)
    {
        if (_states.TryGetValue(requestId, out var state))
        {
            state.IsPaused = true;
            state.ResumeEvent.Reset();
        }
    }

    public void Resume(string requestId)
    {
        if (_states.TryGetValue(requestId, out var state))
        {
            state.IsPaused = false;
            state.ResumeEvent.Set();
        }
    }
}
