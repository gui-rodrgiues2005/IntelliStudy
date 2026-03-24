public class GenerationState
{
    public bool IsPaused { get; set; } = false;
    public ManualResetEventSlim ResumeEvent { get; set; } = new ManualResetEventSlim(true);
}
